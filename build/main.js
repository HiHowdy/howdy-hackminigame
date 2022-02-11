const ConnectedColors = new Map();
ConnectedColors["blue"] = "#3059EC";
ConnectedColors["green"] = "#30EC7B";
ConnectedColors["red"] = "#EC3030";
ConnectedColors["yellow"] = "#DDEC30";
ConnectedColors["orange"] = "#EC6830";
ConnectedColors["cyan"] = "#30ECCA";
ConnectedColors["purple"] = "#8330EC";

const app = Vue.createApp({
    data() {
        return {
            minigameActive: true,
            stage: 0,
            minigameLabel: 'Initializing Hack...',
            progressPercent: 15,
            container: document.querySelector('.wrap'),
            loadingBar: document.querySelector('.loading-bar-inner'),
            numberOfIcons: 4,
            timeToGuess: 4000,
            gameIcons: [
                {icon: '<i class="fas fa-download"></i>', color: 'white', id: 'download', selectedColor: 'white'},
                {icon: '<i class="fas fa-database"></i>', color: 'white', id: 'database', selectedColor: 'white'},
                {icon: '<i class="fas fa-network-wired"></i>', color: 'white', id: 'network', selectedColor: 'white'},
                {icon: '<i class="fas fa-power-off"></i>', color: 'white', id: 'power', selectedColor: 'white'},
                {icon: '<i class="fas fa-hdd"></i>', color: 'white', id: 'storage', selectedColor: 'white'},
                {icon: '<i class="fas fa-microchip"></i>', color: 'white', id: 'chip', selectedColor: 'white'},
                {icon: '<i class="fas fa-server"></i>', color: 'white', id: 'server', selectedColor: 'white'},
            ],
            playableIcons: [

            ],
            iconColors: ["#30EC7B", "#3059EC", "#EC3030", "#EC6830", "#DDEC30", "#30ECCA", "#8330EC"],
            loadingInterval: null,
            currentIconToVerify: 0,
            colorInput: '',
            displayingGuess: false,
            hideFrame: false,
            timerDisplayed: false,
            timeLeft: 5000,
            timerInterval: null,
            timerPercent: 0,
            currentSound: null,
        }
    },
    mounted() {
        this.listener = window.addEventListener('message', (event) => {
          const item = event.data || event.detail; //'detail' is for debuging via browsers
          if (this[item.res]) {
            this[item.res](item);
          }
        });
    },
    computed: {

    },
    watch: {

    },
    methods: {
        // NUI Requests
        BEGIN_MINIGAME(data) {
            this.numberOfIcons = data.icons ? data.icons : 4;
            this.timeToGuess = data.time ? data.time : 4000;
            this.setPlayableIcons();
            this.minigameLabel = 'Initializing Hack...';
            this.minigameActive = true;
            this.stage = 1;
            this.progressPercent = 0;
            this.gameIcons = shuffle(this.gameIcons);

            setTimeout(() => {
                this.container = document.querySelector('.wrap');
                this.container.style.height = "250px";
                this.container.style.opacity = "100%";
                // this.displayDecryptionVerification();
                this.initializeLoading();
            }, 10);
        },
        stopSound() {
            if (!this.currentSound) return;

            this.currentSound.pause();
            this.currentSound.currentTime = 0;
            this.currentSound = null;
        },
        playSound(sound) {
            this.currentSound = new Audio(`./sounds/${sound}.ogg`);
            this.currentSound.play();
        },
        setPlayableIcons() {
            this.gameIcons = shuffle(this.gameIcons);
            this.playableIcons = [];

            for (i = 0; i < this.numberOfIcons; i++) {
                this.playableIcons.push(this.gameIcons[i]);
            }
        },
        initializeLoading() {
            this.loadingInterval = setInterval( () => {
                this.progressPercent += 3.8;

                if (this.progressPercent >= 100) {
                    this.progressPercent = 100;
                    clearInterval(this.loadingInterval)

                    setTimeout(() => {
                        root.beginDecryption();
                    }, 1500);
                }
            }, 400) // 0
        },
        beginDecryption() {
            this.stage = 2;
            this.progressPercent = 0;
            this.minigameLabel = 'Decrypting System...';
            // this.playSound('hacking');

            this.loadingInterval = setInterval( () => {
                this.iconColors = shuffle(this.iconColors);
                this.playableIcons = shuffle(this.playableIcons);
                this.progressPercent += 7.5;

                if (this.progressPercent >= 100) {
                    this.progressPercent = 100;
                    clearInterval(this.loadingInterval);
                    this.minigameLabel = 'Decryption complete... Awaiting user verification';
                    // this.stopSound();
                    setTimeout(() => {
                        root.displayDecryptionVerification();
                    }, 5000);
                }
            }, 400)
        },
        beginTimerInterval(index) {
            clearInterval(this.timerInterval);
            this.timeLeft = this.timeToGuess;
            this.timerPercent = 100;
            const percent = this.timeLeft / 100;
            this.timerDisplayed = true;
            this.playSound('timer');

            this.timerInterval = setInterval(() => {
                if (this.currentIconToVerify == index) {
                    this.timerPercent--;

                    if (this.timerPercent <= 0) {
                        this.timerPercent = 0;
                        this.failHack();
                        clearInterval(this.timerInterval);
                    }
                }
            }, percent);
        },
        displayDecryptionVerification() {
            this.insertColors();
            this.stage = 3;
            this.minigameLabel = "User verification required...";
            this.playableIcons = shuffle(this.playableIcons);
            this.container.style.height = "300px";
            this.beginTimerInterval(this.currentIconToVerify);

            setTimeout(() => {
                document.getElementById("color-guess-input").focus();
            }, 100);
        },
        insertColors() {
            for (const i in this.playableIcons) {
                this.playableIcons[i].color = this.iconColors[i];
            }
        },
        setGuessNext() {
            this.currentIconToVerify++;
            this.displayingGuess = false;
            this.container.style.height = "300px";

            setTimeout(() => {
                document.getElementById("color-guess-input").focus();
            }, 100);
        },
        guessColor() {
            const data = this.playableIcons[this.currentIconToVerify];
            const guess = this.colorInput.toLowerCase();
            const colorExists = ConnectedColors[guess];
            this.timerDisplayed = false;
            clearInterval(this.timerInterval);
            this.stopSound();

            if (colorExists) {
                if (ConnectedColors[guess] == data.color) {
                    this.playableIcons[this.currentIconToVerify].selectedColor = ConnectedColors[guess];

                    if (this.playableIcons.length > this.currentIconToVerify + 1) {
                        this.colorInput = "";
                        this.displayingGuess = true;
                        this.container = document.querySelector('.wrap');
                        this.container.style.height = "150px";

                        setTimeout(() => {
                            root.currentIconToVerify++;
                            this.beginTimerInterval(this.currentIconToVerify);
                            root.displayingGuess = false;
                            root.container.style.height = "300px";

                            setTimeout(() => {
                                document.getElementById("color-guess-input").focus();
                            }, 100);
                        }, 2500);
                    } else {
                        // Finished minigame successfully
                        this.displayingGuess = true;
                        this.container = document.querySelector('.wrap');
                        this.container.style.height = "150px";
                        this.minigameLabel = "Hack successful..."

                        setTimeout(() => {
                            root.stage = 4;

                            setTimeout(() => {
                                post('http://howdy-hackminigame/finished', JSON.stringify({result: true}));
                                root.cleanupMinigame();
                            }, 3000);
                        }, 2500);
                    }
                } else {
                    this.failHack();
                }
            } else {
                this.failHack();
            }
        },
        failHack() {
            this.container = document.querySelector('.wrap');
            this.container.style.height = "150px";
            this.minigameLabel = "Hack failed..."
            this.stage = 4;
            post('http://howdy-hackminigame/finished', JSON.stringify({result: false}));

            setTimeout(() => {
                root.cleanupMinigame();
            }, 3000);
        },
        cleanupMinigame() {
            this.playableIcons = [];
            this.minigameActive = false;
            this.numberOfIcons = 4;
            this.progressPercent = 0;
            this.opacity = 0;
            this.stage = 0;
            this.currentIconToVerify = 0;
            this.displayingGuess = false;
            this.colorInput = '';
            this.stopSound();
            clearInterval(this.loadingInterval);
            clearInterval(this.timerInterval);

            for (const index in this.gameIcons) {
                this.gameIcons[index].color = 'white';
                this.gameIcons[index].selectedColor = 'white';
            }
        }
    }
})

const root = app.mount('#app');

// setTimeout(() => {
//     root.BEGIN_MINIGAME({icons: 5, time: 5000});
// }, 500);

document.addEventListener('keydown', function (e) {
    if (e.which == 9) {
        e.preventDefault();
    }
});

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}