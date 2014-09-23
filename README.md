# Synchronized Video Player Demo

This is a demonstration of synchronizing a video player across multiple browser windows on multiple devices. Each player instance communicates with a server to estimate the offset between the client's system clock and the server's clock. Measures are taken to seek ahead of the current target time offset to give the video enough time to load from the server, so as to avoid pausing to buffer once the video has started playing. If there is sufficient bandwidth to load the video, synchronization should be achieved within approximately 1/20th of a second, i.e. 1-2 video frames.

[View the demo](http://povdocs.github.io/sync-player/)

## License
- Original code is made avalable under [MIT License](http://www.opensource.org/licenses/mit-license.php), Copyright (c) 2014 American Documentary Inc.
- Trailer video from "Koch" by Neil Barsky, Copyright (c) 2014 How Am I Doing Films. All rights reserved.

## Authors
- Code, concept and design by [Brian Chirls](http://chirls.com), POV Digital Technology Fellow
- Trailer video from "Koch" by Neil Barsky
