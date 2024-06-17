# readme of react-plotly-02-py-periodic
A project to show case continuous flow of data from a server to plotly control in react.

## dependencies
you need to execute the following to use this 
> npm install socket.io-client 
react-plotly.js plotly.js

## notable configuration
we are using two servers.
one is this one, vite based, which serves the jsx related things. 
The other one is data server implemented using python. it is beeing served at a different port. so, we need to configure it in vite.config.js file.
