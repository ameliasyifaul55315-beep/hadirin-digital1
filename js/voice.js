const Voice = (() => {

    let welcomeAudio = null;

    /*
     * AUDIO LANDING
     * File:
     * assets/audio/welcome.mp3
     */
    function playWelcome() {
        return new Promise((resolve) => {
            if ("speechSynthesis" in window) {
                try {
                    window.speechSynthesis.cancel();

                    const utterance = new SpeechSynthesisUtterance("Selamat datang di HADIRIN");
                    utterance.lang = "id-ID";
                    utterance.rate = 0.95;
                    utterance.pitch = 1;
                    utterance.volume = 1;

                    utterance.onend = () => resolve(true);
                    utterance.onerror = () => resolve(true);

                    window.speechSynthesis.speak(utterance);
                    return;
                } catch (error) {
                    console.warn("Speech greeting gagal:", error);
                }
            }

            let finished = false;

            const done = () => {
                if (finished) return;
                finished = true;

                if (welcomeAudio) {
                    welcomeAudio.onended = null;
                    welcomeAudio.onerror = null;
                }

                resolve(true);
            };

            try {
                welcomeAudio = new Audio("assets/audio/welcome.mp3");
                welcomeAudio.preload = "auto";
                welcomeAudio.volume = 1;
                welcomeAudio.onended = done;
                welcomeAudio.onerror = () => {
                    console.warn("Audio welcome tidak dapat diputar.");
                    done();
                };

                const promise = welcomeAudio.play();
                if (promise !== undefined) {
                    promise.catch((error) => {
                        console.warn("Autoplay diblokir browser:", error);
                        resolve(false);
                    });
                }
            } catch (error) {
                console.error("Audio error:", error);
                done();
            }
        });
    }


    /*
     * Dipanggil setelah user menekan
     * tombol "Mulai Hadirin"
     */
    async function playWelcomeAfterTap() {
        if ("speechSynthesis" in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance("Selamat datang di HADIRIN");
                utterance.lang = "id-ID";
                utterance.rate = 0.95;
                utterance.pitch = 1;
                utterance.volume = 1;

                return await new Promise((resolve) => {
                    utterance.onend = () => resolve(true);
                    utterance.onerror = () => resolve(true);
                    window.speechSynthesis.speak(utterance);
                });
            } catch (error) {
                console.warn("Speech greeting gagal:", error);
            }
        }

        try {
            if (!welcomeAudio) {
                welcomeAudio = new Audio("assets/audio/welcome.mp3");
                welcomeAudio.preload = "auto";
                welcomeAudio.volume = 1;
            }

            return await new Promise((resolve) => {
                let finished = false;

                const done = () => {
                    if (finished) return;
                    finished = true;

                    welcomeAudio.onended = null;
                    welcomeAudio.onerror = null;

                    resolve(true);
                };

                welcomeAudio.onended = done;
                welcomeAudio.onerror = () => {
                    console.warn("Audio welcome gagal.");
                    done();
                };

                welcomeAudio.play().catch((error) => {
                    console.error("Audio gagal diputar:", error);
                    done();
                });
            });

        } catch (error) {
            console.error("Welcome audio error:", error);
            return true;
        }
    }


    /*
     * BEEP setelah QR berhasil dibaca
     */
    function beep() {

        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContext) return;

            const context =
                new AudioContext();

            const oscillator =
                context.createOscillator();

            const gain =
                context.createGain();

            oscillator.type = "sine";

            oscillator.frequency.value = 880;

            gain.gain.setValueAtTime(
                0.12,
                context.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                context.currentTime + 0.12
            );

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start();

            oscillator.stop(
                context.currentTime + 0.12
            );

            setTimeout(() => {

                try {
                    context.close();
                } catch (e) { }

            }, 300);

        } catch (error) {

            console.warn(
                "Beep gagal:",
                error
            );
        }
    }


    /*
     * SUARA SETELAH PRESENSI BERHASIL
     */
    function success() {

        return new Promise((resolve) => {

            try {

                if (
                    !("speechSynthesis" in window)
                ) {
                    resolve();
                    return;
                }

                window.speechSynthesis.cancel();

                const utterance =
                    new SpeechSynthesisUtterance(
                        "Presensi berhasil."
                    );

                utterance.lang = "id-ID";
                utterance.rate = 0.95;
                utterance.pitch = 1;
                utterance.volume = 1;

                utterance.onend = () => {
                    resolve();
                };

                utterance.onerror = () => {
                    resolve();
                };

                window.speechSynthesis.speak(
                    utterance
                );

            } catch (error) {

                console.warn(
                    "Voice success gagal:",
                    error
                );

                resolve();
            }
        });
    }


    return {
        playWelcome,
        playWelcomeAfterTap,
        beep,
        success
    };

})();