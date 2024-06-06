# Notes by Veenus Adiyodi  2024 06

This is the data server for the react plotly web app: react-plotly-01-py

This server can also be run on virtual environment.
## First time
### Create a virtual environment 
`python -m venv venv`
*Required only once for a machine.*
### Activate the virtual environment 
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

### Install Flask<br>
`pip install Flask`
## Running
### Activate the virtual environment 
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`
### Starting the server 
You may run the server with following command:<br>
`python dataserver.py`

### Validate the response

After running you can verify its working by issuing the follwing command obvioulsy from another terminal/shell:
`curl http://localhost:5000/api/data`
