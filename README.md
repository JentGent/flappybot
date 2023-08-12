# flappybot
Genetic algorithm for Flappy Bird  
Can pass 1000s (even 10s of 1000s if lucky) of pipes by 100 generations (500 individuals per generation)  
Selects the top 10 performers from each generation and slightly modifies their model parameters

The model architecture is constant (Linear -> Tanh -> Linear -> Tanh -> Linear)  
and it takes in as inputs:  
* horizontal distances to next 2 pipes
* vertical distances to top & bottom of next 2 pipes
* current velocity

and outputs a single scalar. For every frame, the bird jumps if the output is greater than 0.

## [Demo](https://rawcdn.githack.com/JentGent/flappybot/1f9fce1ba8440ae249a488cf7fa8a963e5c45140/index.html)
![demo](https://github.com/JentGent/flappybot/blob/main/demo.gif)
