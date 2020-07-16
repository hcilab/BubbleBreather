# BubbleBreather - A Breathing Therapy Game

Bubble Breather is a collection of games and activities that target breathing rehab exercise used during recovery from pneumonia.



## Demo

A live demo of the game can be found here: https://hcilab.github.io/BubbleBreather/



## Hosting the game locally

To access your microphone, Bubble Breather must be hosted using an https server. One easy tool for accomplishing this is http-server-ssl, which can be downloaded and installed here: https://www.npmjs.com/package/http-server-ssl

Once installed, the server can be launched by running the following command in the games top-level project directory:

http-server-ssl -S


Using the output of this command, navigate to the appropriate localhost url in your browser.



## Browser Support and Unsigned SSL Certificates

Bubble breather is currently only supported on Google Chrome. 

However, by default, Chrome does not allow users to visit unsigned https domains (which is the case with http-server-ssl, by default). This restriction can be disabled for locally hosted domains by enabling the following developer setting:

chrome://flags/#allow-insecure-localhost



## Testing your Speaker and Microphone

Bubble Breather has currently been tested on studio-quality microphones, such as the Blue Yeti USB mic. 

However, the game is being actively developed to support more speaker and microphone setups. To view a diagnostics page and test your current speaker and microphone configuration, visit: ./diagnostics.html



## Keyboard and Mouse Controls

For demonstration purposes, keyboard and mouse support has been added to Bubble Breather.

In Bubble Float, use the up-arrow to jump.

In Bubble Paint, hold the spacebar while painting to disable the breathing requirements (i.e., you'll be able to paint simply by clicking-and-holding the mouse).



# Reseting Saved Game Progress

All saved game data can be deleted by visiting: ./reset.html
