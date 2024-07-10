# ReadMe
## adiyodi.snippets1001\data-frame-periodic-77\00-display
created July 2024/Veenus, updated July 2024/Veenus
## About
data-frame-periodic-77 is for demonstrating periodic data display using react. 
00-display is a simple data display on a timer. the data, random numbers created in the client code at the load time. 

The program uses node/vite and at the client side react.

## Running the program
`npm install` - to install needed node packages.

`npm run dev` - will host the development server at `http://localhost:5173/`. 

`npm run build` - will create production build code which has less lengthy js files. 

`npm run preview` - will host the production server at `http://localhost:4173/`. 

## Configuration to control program
This standalone code which has the following major constants in the code.


```js
// app.jsx

const DATA_PRODUCTION_FPS = 33;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 700;
```

* Means this program uses data of `700 frames`.
* Each frame contains `150KB data`. 
* Data being initiated for display in a periodic intervel. `33 Frames` will be initiated in `each seconds`. 


After 700 data, it will cyclically use the data by restarting from 1st frame. 
The data in each frame is a set of +ve numbers ranges from 0 to 65535. A portion of the data is being displayed on screen to give an indication of the values.

### UI 
#### Sample screen
>**Frame Viewer**<br>
Frame: 2135<br>
Data production FPS: 33<br>
Current FPS: 31<br>
Average FPS: 14.47<br>
Average Frame size: 150.00 KB<br>
33406 26110 45777 60543 64933<br>

#### Explanation

`Frame: 2135` - 2135th frame has been displayed on that moment. 
`Data production FPS: 33` - data production planned, the timer, is for 33 FPS, if you watch the browser conole at the intial loading time, you can see the calculation and more information. let me paste here for reference:
##### console.log - loadtime
``` 
datom size:  8<br>
DATA_PRODUCTION_FPS:  33
DATA_PUBLISH_INTERVAL:  30.303030303030305  ms
dataframe[0][0] has a memory footprint of  8  bytes
dataframe[0] has  19200  elements. Has a memory footprint of  153600  bytes ( 150 KB).
```
`Current FPS: 31` - Now we are getting 31 FPS performance. comparing with previous frame. This is so dynamic.

`Average FPS: 14.47` - This is the average performance figure.

`Average Frame size: 150.00 KB` - The size of each frame has been averaged. This is not meaningful as we create same sized frames. But in future updates, other than 00-display, where data will be supplied from a peer or server, this will be a meaningful metric to evaluate the average FPS. 

`33406 26110 45777 60543 64933` - 5 numerical values from the last frame displayed. this is to give a feel of dynamic data/payload. Practially instead of this simple text display, this data can be used to display graphs (or other appropriate UI). Anyway, each number takes 8 bytes according to the console log. 

##### Interpretation

Though we have tried for 33 FPS, our display may not be updated on that pace. Everything depend on the target machine/processer/os, browser and its load.

By targetting 33 FPS, a timer of 30.303030303030305ms has been created. But practically, 14.47 FPS has only been achieved for these 2000+ frames. However, the latest FPS is good it is 31. So, somehow some external factors like, os memory or the applications ran on the background, affected the performance in between.




# Appendix: 
Tempate notes from Vite when the project been created
## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
