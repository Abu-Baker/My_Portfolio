import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { map, take, finalize, takeWhile } from 'rxjs/operators';

enum DifficultyLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  title = 'guess-game-app';
  userGuess!: any;
  status: string = '';
  showResult: boolean = false;
  difficultyLevel: string = 'easy';
  errorMessage: string = '';
  numberRange: number = 20;
  deviationFromOriginal!: number;
  numberOfAttempts!: number;
  originalNumber!: number;
  gameInitialized: boolean = false;
  maxAttemptsAllowed: number = 10;
  remainingTimeInSeconds = 60;
  timer$: Observable<number> = new Observable<number>();
  timerSubscription: Subscription | undefined;
  userScore: number = 0;
  userHighScores: { difficulty: string, score: number }[] = [];

  ngOnInit() {
    this.loadUserHighScores();
  }

  verifyUserGuess() {
    if (!this.isUserGuessValid()) {
      return;
    }

    if (this.maxAttemptsAllowed < 1) {
      this.handleGameLoss();
    } else if (this.isExactGuess()) {
      this.handleExactGuess();
    } else {
      this.handleIncorrectGuess();
    }
  }

  isUserGuessValid(): boolean {
    if (this.userGuess > this.numberRange || this.userGuess < 1) {
      this.errorMessage = `Please select a number between 1 and ${this.numberRange}`;
      this.status = 'error';
      this.showResult = true;
      return false;
    }
    return true;
  }

  handleGameLoss() {
    alert("You lost the game");
    this.initializeGame();
  }

  isExactGuess(): boolean {
    return this.remainingTimeInSeconds > 1 && this.originalNumber === this.userGuess;
  }

  handleExactGuess() {
    this.errorMessage = "Exact number 🎉";
    this.status = 'success';
    this.showResult = true;
    this.calculateUserScore();
    alert("Hurray you win the Game");
  }

  handleIncorrectGuess() {
    this.deviationFromOriginal = this.originalNumber - this.userGuess;
    this.errorMessage = `Try again. Your guess is ${this.deviationFromOriginal < 0 ? "higher" : "lower"}`;
    this.status = 'try';
    this.numberOfAttempts++;
    this.maxAttemptsAllowed--;
    this.showResult = true;
    this.calculatePenalties();
    this.calculateUserScore();
  }

  initializeGame() {
    this.numberOfAttempts = 0;
    this.originalNumber = Math.floor(Math.random() * this.numberRange) + 1;
    this.userGuess = 0;
    this.deviationFromOriginal = 0;
    this.gameInitialized = true;
    this.numberRange = 20;
    this.maxAttemptsAllowed = 10;
    this.userScore = 0;
    this.resetGameTimer();
    this.showResult = false;
  }

  resetGameTimer() {
    this.unsubscribeGameTimer();
  
    this.remainingTimeInSeconds = 60;
    this.timer$ = interval(1000).pipe(
      takeWhile(() => this.remainingTimeInSeconds > 0), // Stop when remaining time is 0 or negative
      map(() => --this.remainingTimeInSeconds),
      finalize(() => this.initializeGame())
    );
  
    this.timerSubscription = this.timer$.subscribe();
  }
  

  calculatePenalties() {
    this.remainingTimeInSeconds -= 5; // Deduct 5 seconds as a penalty
  }

  calculateUserScore() {
    this.userScore = this.numberOfAttempts * 10 + (10 - this.maxAttemptsAllowed) * 5 + (60 - this.remainingTimeInSeconds);
  }

  saveUserHighScore() {
    const existingHighScores = JSON.parse(localStorage.getItem('userHighScores') || '[]');
    existingHighScores.push({ difficulty: this.difficultyLevel, score: this.userScore });
    localStorage.setItem('userHighScores', JSON.stringify(existingHighScores));
    this.loadUserHighScores();
  }

  loadUserHighScores() {
    this.userHighScores = JSON.parse(localStorage.getItem('userHighScores') || '[]');
  }

  onDifficultyLevelChange() {
    switch (this.difficultyLevel) {
      case 'easy':
        this.numberRange = 10;
        this.maxAttemptsAllowed = 10;
        break;
      case 'medium':
        this.numberRange = 50;
        this.maxAttemptsAllowed = 6;
        break;
      case 'hard':
        this.numberRange = 100;
        this.maxAttemptsAllowed = 3;
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.unsubscribeGameTimer();
  }

  getColor() {
    switch (this.status) {
      case 'success':
        return 'lightgreen';
      case 'error':
        return 'lightcoral';
      case 'try':
        return 'lightblue';
      default:
        return '';
    }
  }

  private unsubscribeGameTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}
