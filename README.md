#SpotiPI
SpotiPI is a web-based communal jukebox powered by Spotify that can run on a RaspberryPI, among other devices. 

SpotiPI allows users to collaboratively control the songs that are going to be played next from a central audio source. 

![SpotiPI Desktop Web Interface](http://i.imgur.com/BeWiQ5v.png)

![SpotiPI Mobile Interface](http://i.imgur.com/j7ywR5k.png)

##Getting Started

In order to use SpotiPI, you must:

 1. Have the pyspotify and pyaudio dependencies installed.
 2. Download a copy of SpotiPI to the target device
 3. Download a libspotify API key from [Spotify's website](https://devaccount.spotify.com/my-account/keys/)
 4. Start the SpotiPI server with a pair of Spotify Premium credentials

###Install dependencies
SpotiPI depends on [pyspotify](https://github.com/mopidy/pyspotify), which you can install by running:

    pip install pyspotify

You may have to install pyspotify's dependancies first, which can be done on Raspbian by running:

    sudo apt-get install build-essential python-dev python3-dev libffi-dev

You can also install pyspotify from APT with the command:

    sudo apt-get install python-spotify

You may also need to install the pyaudio library:

    sudo apt-get install python-pyaudio

###Download SpotiPI

You then need to download SpotiPI, generally by cloning this repo. 

    git clone https://github.com/abartow/SpotiPI.git


###Request and Download a libspotify API key

Go to the [Spotify Developer Website](https://devaccount.spotify.com/my-account/keys/) and fill out a request for a Spotify Developer Key. The request should be automatically approved. Then download the binary version of that key and place it in your SpotiPI directory, ensuring that the file is named "spotify_appkey.key". 

###Start the SpotiPI Server

Finally, in order to start the server, run the command in the SpotiPI directory:

    python server.py SPOTIFYUSERNAME SPOTIFYPASSWORD

For the first run, you must specific a Spotify username and password. SpotiPI will remember your sessions, so you do not need to specify credentials for subsequent runs until your Spotify session expires. The Spotify user used to authenticate the server must be a Spotify Premium subscriber. 

##Connecting to the SpotiPI Web Interface

While the SpotiPI server is running, it by default listens for connections on port 8000. To view the web interface, open a web browser and navigate to the server running SpotiPI on port 8000. 

![SpotiPI running a Web Browser](http://i.imgur.com/5y1pMqV.png)

