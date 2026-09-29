/* HADIRIN - CAMERA SCANNER */

const Scanner = (() => {
    let video = null;
    let canvas = null;
    let ctx = null;
    let stream = null;
    let devices = [];
    let currentDeviceIndex = 0;
    let scanning = false;
    let locked = false;
    let animationId = null;
    let onDetected = null;
    let detector = null;

    function init(videoElement, canvasElement) {
        video = videoElement || document.getElementById("camVideo");
        canvas = canvasElement || document.getElementById("scanCanvas");

        if (!video || !canvas) {
            return false;
        }

        ctx = canvas.getContext("2d", { willReadFrequently: true });
        video.playsInline = true;
        video.autoplay = true;
        video.muted = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");

        return true;
    }

    async function getDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return [];
        }

        try {
            const list = await navigator.mediaDevices.enumerateDevices();
            devices = list.filter(device => device.kind === "videoinput");
            if (devices.length && currentDeviceIndex >= devices.length) {
                currentDeviceIndex = 0;
            }
            return devices;
        } catch (error) {
            console.error("Gagal membaca kamera:", error);
            return [];
        }
    }

    function chooseDefaultDevice(list) {
        if (!list.length) return null;
        const back = list.find(device => /back|rear|environment|main camera/i.test(device.label || ""));
        if (back) return back;
        const front = list.find(device => /front|selfie|user/i.test(device.label || ""));
        return front || list[0];
    }

    function clearLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    async function stopCamera() {
        scanning = false;
        locked = false;
        clearLoop();

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        if (video) {
            try { video.pause(); } catch (error) { }
            video.srcObject = null;
        }
    }

    async function waitForVideoReady() {
        await new Promise(resolve => {
            const check = () => {
                if (video && video.readyState >= 2 && video.videoWidth > 0) {
                    resolve();
                    return;
                }
                requestAnimationFrame(check);
            };
            check();
        });
    }

    async function openCamera(deviceId = null) {
        if (!video && !init()) {
            throw new Error("Scanner belum diinisialisasi.");
        }

        await stopCamera();

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser tidak mendukung akses kamera.");
        }

        await getDevices();

        const selectedDevice = deviceId || chooseDefaultDevice(devices)?.deviceId || null;
        const base = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };

        let options = {
            audio: false,
            video: { ...base, facingMode: { ideal: "environment" } }
        };

        if (selectedDevice) {
            options = {
                audio: false,
                video: { ...base, deviceId: { exact: selectedDevice } }
            };
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia(options);
        } catch (error) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { ...base, facingMode: { ideal: "user" } }
                });
            } catch (fallbackError) {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true
                });
            }
        }

        video.srcObject = stream;
        video.playsInline = true;
        video.autoplay = true;
        video.muted = true;

        try {
            await video.play();
        } catch (error) {
            // mobil / browser bisa menunda play sampai user interaction
        }

        await waitForVideoReady();

        try {
            if ("BarcodeDetector" in window) {
                detector = new BarcodeDetector({ formats: ["qr_code"] });
            }
        } catch (error) {
            detector = null;
        }

        const activeTrack = stream.getVideoTracks()[0];
        if (activeTrack) {
            const settings = activeTrack.getSettings?.() || {};
            const trackId = settings.deviceId;
            if (trackId) {
                const idx = devices.findIndex(device => device.deviceId === trackId);
                if (idx >= 0) currentDeviceIndex = idx;
            }

            try {
                const caps = activeTrack.getCapabilities?.();
                if (caps && caps.focusMode && caps.focusMode.includes("continuous")) {
                    await activeTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
                }
            } catch (error) { }
        }

        return true;
    }

    function handleDetected(rawValue) {
        if (locked) return true;
        locked = true;
        scanning = false;
        clearLoop();

        try {
            Voice.beep();
        } catch (error) {
            console.warn("Beep QR gagal:", error);
        }

        if (typeof onDetected === "function") {
            onDetected(String(rawValue));
        }

        return true;
    }

    function scanLoop() {
        if (!scanning || !video || !canvas || !ctx || locked) {
            return;
        }

        if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
            animationId = requestAnimationFrame(scanLoop);
            return;
        }

        try {
            const width = video.videoWidth;
            const height = video.videoHeight;
            const targetWidth = Math.min(width, 720);
            const targetHeight = Math.round((targetWidth * height) / width);

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const result = typeof jsQR !== "undefined"
                ? jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" })
                : null;

            if (result && result.data) {
                handleDetected(result.data);
                return;
            }

            if (detector) {
                detector.detect(canvas).then(detected => {
                    if (!locked && detected && detected[0]?.rawValue) {
                        handleDetected(detected[0].rawValue);
                    }
                }).catch(() => { });
            }
        } catch (error) {
            console.error("QR scan error:", error);
        }

        animationId = requestAnimationFrame(scanLoop);
    }

    async function start(callback) {
        if (callback) onDetected = callback;
        if (!video && !init()) {
            throw new Error("Scanner belum diinisialisasi.");
        }

        clearLoop();
        locked = false;
        scanning = false;
        await openCamera();

        scanning = true;
        scanLoop();
        return true;
    }

    async function switchCamera(callback) {
        if (callback) onDetected = callback;
        if (!navigator.mediaDevices) {
            throw new Error("Akses kamera tidak tersedia.");
        }

        await getDevices();
        if (devices.length < 2) {
            await openCamera();
            return true;
        }

        currentDeviceIndex = (currentDeviceIndex + 1) % devices.length;
        await openCamera(devices[currentDeviceIndex].deviceId);

        scanning = true;
        locked = false;
        scanLoop();
        return true;
    }

    function setDetectedCallback(callback) {
        onDetected = callback;
    }

    function unlock() {
        locked = false;
        if (!scanning) {
            scanning = true;
            scanLoop();
        }
    }

    async function stop() {
        await stopCamera();
    }

    function getCameraCount() {
        return devices.length;
    }

    function getCurrentCameraName() {
        if (!devices.length) return "Kamera";
        return devices[currentDeviceIndex]?.label || `Kamera ${currentDeviceIndex + 1}`;
    }

    return { init, start, stop, switchCamera, unlock, setDetectedCallback, getCameraCount, getCurrentCameraName };
})();