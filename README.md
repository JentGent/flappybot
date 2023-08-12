# flappybot
Genetic algorithm for Flappy Bird  
Can pass 1000s (even 10s of 1000s if lucky) of pipes within 100 generations (500 individuals per generation)  
Selects the top 10 performers from each generation and slightly modifies their model parameters

The model architecture is constant (Linear -> Tanh -> Linear -> Tanh -> Linear)  
and it takes in as inputs:  
* horizontal distances to next 2 pipes
* vertical distances to top & bottom of next 2 pipes
* current velocity

and outputs a single scalar. For every frame, the bird jumps if the output is greater than 0.

## [Demo](https://raw.githack.com/JentGent/flappybot/main/index.html)
![demo](https://github.com/JentGent/flappybot/blob/main/demo.gif)

The outcome varies, but it seems that in many runs that achieve high scores, one generation suddenly learns some key skill, as in this one example:
```
Generation 60 best: 30
Generation 61 best: 20
Generation 62 best: 30
Generation 63 best: 37
Generation 64 best: 6859 *!*
Generation 65 best: 7545
Generation 66 best: 2147
Generation 67 best: 14140
Generation 68 best: 7786
Generation 69 best: 34285
```
