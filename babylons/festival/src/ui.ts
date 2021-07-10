import {
  Effect,
  ParticleSystem,
  PostProcess,
  Scene,
  Sound,
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Grid,
  Image,
  Rectangle,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';
import { NUM_LANTERNS } from './constants';
import { isMobileBrowser, noop } from './utils';

/**
 * heads up display
 */
export class Hud {
  private _scene: Scene;

  // game timer
  public time: number; // keep track to signal end game REAL TIME

  private _prevTime: number = 0;
  private _clockTime: TextBlock; // GAME TIME display
  private _startTime: number;
  private _stopTimer: boolean;
  private _sString = '00';
  private _mString = 11;
  private _lanternCount: TextBlock; // lantern counter display

  // Animated UI sprites
  private _sparklerLife: Image;
  private _spark: Image;

  // Timer handlers
  public stopSpark: boolean;
  private _handle: number;
  private _sparkhandle: number;

  // Pause toggle
  public gamePaused: boolean;

  // Quit game
  public quit: boolean;
  public transition: boolean = false;

  // UI Elements
  public pauseButton: Button;
  public fadeLevel: number;
  private _playerUI: AdvancedDynamicTexture;
  private _pauseMenu: Rectangle;
  private _controls: Rectangle;
  public tutorial: Rectangle;
  public hint: Rectangle;

  // Mobile
  public isMobile: boolean;
  public jumpBtn: Button;
  public dashBtn: Button;
  public leftBtn: Button;
  public rightBtn: Button;
  public upBtn: Button;
  public downBtn: Button;

  // Sounds
  public quitSfx: Sound;
  private _sfx: Sound;
  private _pause: Sound;
  private _sparkWarningSfx: Sound;

  constructor(scene: Scene) {
    this._scene = scene;

    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    playerUI.idealHeight = 720;
    this._playerUI = playerUI;

    const lanternCount = new TextBlock();
    lanternCount.name = 'lantern count';
    lanternCount.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
    lanternCount.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    lanternCount.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    lanternCount.fontSize = '22px';
    lanternCount.color = 'white';
    lanternCount.text = `Lanterns: 1 / ${NUM_LANTERNS}`;
    lanternCount.top = '32px';
    lanternCount.left = '-64px';
    lanternCount.width = '25%';
    lanternCount.fontFamily = 'Viga';
    lanternCount.resizeToFit = true;
    playerUI.addControl(lanternCount);
    this._lanternCount = lanternCount;

    const stackPanel = new StackPanel();
    stackPanel.height = '100%';
    stackPanel.width = '100%';
    stackPanel.top = '14px';
    stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    playerUI.addControl(stackPanel);

    // geme timer text
    const clockTime = new TextBlock();
    clockTime.name = 'clock';
    clockTime.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    clockTime.fontSize = '48px';
    clockTime.color = 'white';
    clockTime.text = '11:00';
    clockTime.resizeToFit = true;
    clockTime.height = '96px';
    clockTime.width = '220px';
    clockTime.fontFamily = 'Viga';
    stackPanel.addControl(clockTime);
    this._clockTime = clockTime;

    // sparkler bar animation
    const sparklerLife = new Image('sparkLife', './sprites/sparkLife.png');
    sparklerLife.width = '54px';
    sparklerLife.height = '162px';
    sparklerLife.cellId = 0;
    sparklerLife.cellHeight = 108;
    sparklerLife.cellWidth = 36;
    sparklerLife.sourceWidth = 36;
    sparklerLife.sourceHeight = 108;
    sparklerLife.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    sparklerLife.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    sparklerLife.left = '14px';
    sparklerLife.top = '14px';
    playerUI.addControl(sparklerLife);
    this._sparklerLife = sparklerLife;

    const spark = new Image('spark', './sprites/spark.png');
    spark.width = '40px';
    spark.height = '40px';
    spark.cellId = 0;
    spark.cellHeight = 20;
    spark.cellWidth = 20;
    spark.sourceWidth = 20;
    spark.sourceHeight = 20;
    spark.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    spark.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    spark.left = '21px';
    spark.top = '20px';
    playerUI.addControl(spark);
    this._spark = spark;

    const pauseBtn = Button.CreateImageOnlyButton(
      'pauseBtn',
      './sprites/pauseBtn.png'
    );
    pauseBtn.width = '48px';
    pauseBtn.height = '86px';
    pauseBtn.thickness = 0;
    pauseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    pauseBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    pauseBtn.top = '-16px';
    playerUI.addControl(pauseBtn);
    pauseBtn.zIndex = 10;
    this.pauseButton = pauseBtn;
    // when the button is clicked, make pause menu visable and add control to it
    pauseBtn.onPointerDownObservable.add(() => {
      this._pauseMenu.isVisible = true;
      playerUI.addControl(this._pauseMenu);
      this.pauseButton.isHitTestVisible = false;

      // when game is paused, make sure that the next start time is the time it was when paused
      this.gamePaused = true;
      this._prevTime = this.time;

      // --SOUNDS--
      this._scene.getSoundByName('gameSong')?.pause();
      this._pause.play(); // play pause music
    });

    // popup tutorials + hint
    const tutorial = new Rectangle();
    tutorial.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    tutorial.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tutorial.top = '12%';
    tutorial.left = '-1%';
    tutorial.height = 0.2;
    tutorial.width = 0.2;
    tutorial.thickness = 0;
    tutorial.alpha = 0.6;
    this._playerUI.addControl(tutorial);
    this.tutorial = tutorial;

    // movement image, will disappear once you attempt all of the moves
    const movementPC = new Image('pause', 'sprites/tutorial.jpeg');
    tutorial.addControl(movementPC);

    const hint = new Rectangle();
    hint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    hint.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    hint.top = '14%';
    hint.left = '-4%';
    hint.height = 0.08;
    hint.width = 0.08;
    hint.thickness = 0;
    hint.alpha = 0.6;
    hint.isVisible = false;
    this._playerUI.addControl(hint);
    this.hint = hint;

    // hint to the first lantern, will disappear once you light it
    const lanternHint = new Image('lantern1', 'sprites/arrowBtn.png');
    lanternHint.rotation = Math.PI / 2;
    lanternHint.stretch = Image.STRETCH_UNIFORM;
    lanternHint.height = 0.8;
    lanternHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    hint.addControl(lanternHint);
    const moveHint = new TextBlock('move', 'Move Right');
    moveHint.color = 'white';
    moveHint.fontSize = '12px';
    moveHint.fontFamily = 'Viga';
    moveHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    moveHint.textWrapping = true;
    moveHint.resizeToFit = true;
    hint.addControl(moveHint);

    this._createPauseMenu();
    this._createControlsMenu();
    this._loadSounds(scene);

    // check if mobile, add button controls
    if (isMobileBrowser()) {
      this.isMobile = true; // tells inputController to track mobile inputs

      // tutorial image
      movementPC.isVisible = false;
      let movementMobile = new Image('pause', 'sprites/tutorialMobile.jpeg');
      tutorial.addControl(movementMobile);
      // --ACTION BUTTONS--
      // container for action buttons (right side of screen)
      const actionContainer = new Rectangle();
      actionContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      actionContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      actionContainer.height = 0.4;
      actionContainer.width = 0.2;
      actionContainer.left = '-2%';
      actionContainer.top = '-2%';
      actionContainer.thickness = 0;
      playerUI.addControl(actionContainer);

      // grid for action button placement
      const actionGrid = new Grid();
      actionGrid.addColumnDefinition(0.5);
      actionGrid.addColumnDefinition(0.5);
      actionGrid.addRowDefinition(0.5);
      actionGrid.addRowDefinition(0.5);
      actionContainer.addControl(actionGrid);

      const dashBtn = Button.CreateImageOnlyButton(
        'dash',
        './sprites/aBtn.png'
      );
      dashBtn.thickness = 0;
      dashBtn.alpha = 0.8;
      dashBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.dashBtn = dashBtn;

      const jumpBtn = Button.CreateImageOnlyButton(
        'jump',
        './sprites/bBtn.png'
      );
      jumpBtn.thickness = 0;
      jumpBtn.alpha = 0.8;
      jumpBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.jumpBtn = jumpBtn;

      actionGrid.addControl(dashBtn, 0, 1);
      actionGrid.addControl(jumpBtn, 1, 0);

      //--MOVEMENT BUTTONS--
      // container for movement buttons (section left side of screen)
      const moveContainer = new Rectangle();
      moveContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      moveContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      moveContainer.height = 0.4;
      moveContainer.width = 0.4;
      moveContainer.left = '2%';
      moveContainer.top = '-2%';
      moveContainer.thickness = 0;
      playerUI.addControl(moveContainer);

      // grid for placement of arrow keys
      const grid = new Grid();
      grid.addColumnDefinition(0.4);
      grid.addColumnDefinition(0.4);
      grid.addColumnDefinition(0.4);
      grid.addRowDefinition(0.5);
      grid.addRowDefinition(0.5);
      moveContainer.addControl(grid);

      const leftBtn = Button.CreateImageOnlyButton(
        'left',
        './sprites/arrowBtn.png'
      );
      leftBtn.thickness = 0;
      leftBtn.rotation = -Math.PI / 2;
      leftBtn.color = 'white';
      leftBtn.alpha = 0.8;
      leftBtn.width = 0.8;
      leftBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.leftBtn = leftBtn;

      const rightBtn = Button.CreateImageOnlyButton(
        'right',
        './sprites/arrowBtn.png'
      );
      rightBtn.rotation = Math.PI / 2;
      rightBtn.thickness = 0;
      rightBtn.color = 'white';
      rightBtn.alpha = 0.8;
      rightBtn.width = 0.8;
      rightBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.rightBtn = rightBtn;

      const upBtn = Button.CreateImageOnlyButton(
        'up',
        './sprites/arrowBtn.png'
      );
      upBtn.thickness = 0;
      upBtn.alpha = 0.8;
      upBtn.color = 'white';
      this.upBtn = upBtn;

      const downBtn = Button.CreateImageOnlyButton(
        'down',
        './sprites/arrowBtn.png'
      );
      downBtn.thickness = 0;
      downBtn.rotation = Math.PI;
      downBtn.color = 'white';
      downBtn.alpha = 0.8;
      this.downBtn = downBtn;

      // arrange the buttons in the grid
      grid.addControl(leftBtn, 1, 0);
      grid.addControl(rightBtn, 1, 2);
      grid.addControl(upBtn, 0, 1);
      grid.addControl(downBtn, 1, 1);
    }
  }

  public updateHud(): void {
    if (!this._stopTimer && this._startTime !== null) {
      const curTime =
        Math.floor((new Date().getTime() - this._startTime) / 1000) +
        this._prevTime;
      // divide by 1000 to get seconds

      this.time = curTime;
      this._clockTime.text = this._formatTime(curTime);
    }
  }

  public updateLanternCount(numLanterns: number): void {
    this._lanternCount.text = `Lanterns: ${numLanterns} / ${NUM_LANTERNS}`;
  }

  // Game Timer
  public startTimer(): void {
    this._startTime = new Date().getTime();
    this._stopTimer = false;
  }
  public stopTimer(): void {
    this._stopTimer = true;
  }

  // format the time so that it is relative to 11:00 -- game time
  private _formatTime(time: number): string {
    const minsPassed = Math.floor(time / 60); // seconds in a min
    const secPassed = time % 240; // goes back to 0 after 4mins/240sec
    // gameclock works like:
    //   4 mins = 1 hr game time
    //   4 secs = 1/15 = 1min game time
    if (secPassed % 4 === 0) {
      this._mString = Math.floor(minsPassed / 4) + 11;
      this._sString = (secPassed / 4 < 10 ? '0' : '') + secPassed / 4;
    }
    const day = this._mString == 11 ? ' PM' : ' AM';
    return `${this._mString}:${this._sString} ${day}`;
  }

  // ---- Sparkler Timers ----
  // start and restart sparkler, handles setting the texture and animation frame
  public startSparklerTimer(sparkler?: ParticleSystem) {
    this.stopSpark = false;
    this._sparklerLife.cellId = 0;
    this._spark.cellId = 0;
    if (this._handle) {
      window.clearInterval(this._handle);
    }
    if (this._sparkhandle) {
      window.clearInterval(this._sparkhandle);
    }

    // sounds
    this._sparkWarningSfx.stop(); // if your restart the sparkler while this was playing
    // (it technically would never reach ceallId == 10, so you nned to stop the sound)

    if (sparkler) {
      sparkler.start();
      this._scene.getLightByName('sparklight')!.intensity = 35;
    }

    // sparkler animation, every 2 seconds update for 10 bars of sparklife
    this._handle = window.setInterval(() => {
      if (this.gamePaused) {
        // if the game is paused, also pause the warning sfx
        this._sparkWarningSfx.pause();
      } else {
        const { cellId } = this._sparklerLife;
        if (cellId < 10) {
          this._sparklerLife.cellId += 1;
        }
        if (cellId === 9) {
          this._sparkWarningSfx.play();
        }
        if (cellId === 10) {
          this.stopSpark = true;
          window.clearInterval(this._handle);
          this._sparkWarningSfx.stop();
        }
      }
    }, 2000);
    this._sparkhandle = window.setInterval(() => {
      if (this.gamePaused) {
        return;
      }

      const { cellId: lifeId } = this._sparklerLife;
      const { cellId } = this._spark;

      if (lifeId < 10 && cellId < 5) {
        this._spark.cellId += 1;
      } else if (lifeId < 10 && cellId >= 5) {
        this._spark.cellId = 0;
      } else {
        this._spark.cellId = 0;
        window.clearInterval(this._sparkhandle);
      }
    }, 185);
  }
  public stopSparklerTimer(sparkler?: ParticleSystem): void {
    this.stopSpark = true;
    if (sparkler) {
      sparkler.stop();
      this._scene.getLightByName('sparklight')!.intensity = 0;
    }
  }

  // -- Pause Menu Popup --
  private _createPauseMenu(): void {
    this.gamePaused = false;

    const pauseMenu = new Rectangle();
    pauseMenu.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    pauseMenu.height = 0.8;
    pauseMenu.width = 0.5;
    pauseMenu.thickness = 0;
    pauseMenu.isVisible = false;

    // background image
    const image = new Image('pause', 'sprites/pause.jpeg');
    pauseMenu.addControl(image);

    // stack panel for the buttons
    const stackPanel = new StackPanel();
    stackPanel.width = 0.83;
    pauseMenu.addControl(stackPanel);

    const resumeBtn = Button.CreateSimpleButton('resume', 'RESUME');
    resumeBtn.width = 0.18;
    resumeBtn.height = '44px';
    resumeBtn.color = 'white';
    resumeBtn.fontFamily = 'Viga';
    resumeBtn.paddingBottom = '14px';
    resumeBtn.cornerRadius = 14;
    resumeBtn.fontSize = '12px';
    resumeBtn.textBlock!.resizeToFit = true;
    resumeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    resumeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    stackPanel.addControl(resumeBtn);

    this._pauseMenu = pauseMenu;

    // when the button is down, make menu invisable and remove control of the menu
    resumeBtn.onPointerDownObservable.add(() => {
      this._pauseMenu.isVisible = false;
      this._playerUI.removeControl(this._pauseMenu);
      this.pauseButton.isHitTestVisible = true;

      // game unpaused, our time is now reset
      this.gamePaused = false;
      this._startTime = new Date().getTime();

      //--SOUNDS--
      this._scene.getSoundByName('gameSong')?.play();
      this._pause.stop();

      if (this._sparkWarningSfx.isPaused) {
        this._sparkWarningSfx.play();
      }
      this._sfx.play(); // play transition sound
    });

    const controlsBtn = Button.CreateSimpleButton('controls', 'CONTROLS');
    controlsBtn.width = 0.18;
    controlsBtn.height = '44px';
    controlsBtn.color = 'white';
    controlsBtn.fontFamily = 'Viga';
    controlsBtn.paddingBottom = '14px';
    controlsBtn.cornerRadius = 14;
    controlsBtn.fontSize = '12px';
    resumeBtn.textBlock!.resizeToFit = true;
    controlsBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    controlsBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    stackPanel.addControl(controlsBtn);

    // when the button is down, make menu invisable and remove control of the menu
    controlsBtn.onPointerDownObservable.add(() => {
      // open controls screen
      this._controls.isVisible = true;
      this._pauseMenu.isVisible = false;

      // play transition sound
      this._sfx.play();
    });

    const quitBtn = Button.CreateSimpleButton('quit', 'QUIT');
    quitBtn.width = 0.18;
    quitBtn.height = '44px';
    quitBtn.color = 'white';
    quitBtn.fontFamily = 'Viga';
    quitBtn.paddingBottom = '12px';
    quitBtn.cornerRadius = 14;
    quitBtn.fontSize = '12px';
    resumeBtn.textBlock!.resizeToFit = true;
    quitBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    quitBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    stackPanel.addControl(quitBtn);

    // set up transition effect
    Effect.RegisterShader(
      'fade',
      'precision highp float;' +
        'varying vec2 vUV;' +
        'uniform sampler2D textureSampler; ' +
        'uniform float fadeLevel; ' +
        'void main(void){' +
        'vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;' +
        'baseColor.a = 1.0;' +
        'gl_FragColor = baseColor;' +
        '}'
    );
    this.fadeLevel = 1.0;

    quitBtn.onPointerDownObservable.add(() => {
      const postProcess = new PostProcess(
        'Fade',
        'fade',
        ['fadeLevel'],
        null,
        1.0,
        this._scene.getCameraByName('cam')
      );
      postProcess.onApply = (effect) => {
        effect.setFloat('fadeLevel', this.fadeLevel);
      };
      this.transition = true;

      //--SOUNDS--
      this.quitSfx.play();
      if (this._pause.isPlaying) {
        this._pause.stop();
      }
    });
  }
  // -- Controls Menu Popup --
  private _createControlsMenu(): void {
    const controls = new Rectangle();
    controls.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    controls.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    controls.height = 0.8;
    controls.width = 0.5;
    controls.thickness = 0;
    controls.color = 'white';
    controls.isVisible = false;
    this._playerUI.addControl(controls);
    this._controls = controls;

    // background image
    const image = new Image('controls', 'sprites/controls.jpeg');
    controls.addControl(image);

    const title = new TextBlock('title', 'CONTROLS');
    title.resizeToFit = true;
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.fontFamily = 'Viga';
    title.fontSize = '32px';
    title.top = '14px';
    controls.addControl(title);

    const backBtn = Button.CreateImageOnlyButton(
      'back',
      './sprites/lanternbutton.jpeg'
    );
    backBtn.width = '40px';
    backBtn.height = '40px';
    backBtn.top = '14px';
    backBtn.thickness = 0;
    backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    controls.addControl(backBtn);

    // when the button is down, make menu invisable and remove control of the menu
    backBtn.onPointerDownObservable.add(() => {
      this._pauseMenu.isVisible = true;
      this._controls.isVisible = false;

      // play transition sound
      this._sfx.play();
    });
  }

  // load all sounds needed for game ui interactions
  private _loadSounds(scene: Scene): void {
    this._pause = new Sound('pauseSong', './sounds/Snowland.wav', scene, noop, {
      volume: 0.2,
    });

    this._sfx = new Sound(
      'selection',
      './sounds/vgmenuselect.wav',
      scene,
      noop
    );

    this.quitSfx = new Sound(
      'quit',
      './sounds/Retro_Event_UI_13.wav',
      scene,
      noop
    );

    this._sparkWarningSfx = new Sound(
      'sparkWarning',
      './sounds/Retro_Water_Drop_01.wav',
      scene,
      noop,
      {
        loop: true,
        volume: 0.5,
        playbackRate: 0.6,
      }
    );
  }
}
