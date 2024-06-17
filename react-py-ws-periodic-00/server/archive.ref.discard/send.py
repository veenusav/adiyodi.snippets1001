#send.py - by Veenus, 1074vectors, Jan 2024
#send binary data (frame of floats)

NO_OF_FRAMES =80
PORT = 5000
# Number of floating point values to generate. 
count_of_data = int(131 * 1024 / 4)  # kbNeeded * 1024 / bytesForFloat
# count_of_data = int(4)

import asyncio
import struct
import time
import websockets
# Global variable to hold floating point values
floating_point_values = []

# Function to populate floating_point_values
def populateBindata(countOfData):
    return [i * 1.5 for i in range(countOfData)]  # simple - generate a series of float values

print("Populating dummy data for sending experiments..")
# populateBindata will create dummy values
floating_point_values = populateBindata(count_of_data)
totalDurationForPacking = 0
totalDurationForSendFunction = 0
countOfPacketsSent = 0

async def send_binary_data(websocket, path):
    # floating_point_values = [1.23, 4.56, 7.89]  # Generate simple binary data

    # Adding a timestamp header
    timeStamp0 = time.time() * 1000 # Get the initial timestamp
    timestamp_header = struct.pack('d', timeStamp0)  # 'd' for double format
    
    binary_data = timestamp_header
    for value in floating_point_values:
        binary_data += struct.pack('f', value)  # 'f' for float format

    timeStamp1 = time.time() * 1000 
    binary_data += struct.pack('d', timeStamp1)  # 'd' for double format

    # Log size of binary data in bytes before sending
    print(f"Sending {len(binary_data)/1024} KB. {len(binary_data)} bytes.")
    # Send binary data
    await websocket.send(binary_data)
    timeStamp2 = time.time() * 1000     
    await asyncio.sleep(0)
    
    global totalDurationForPacking, totalDurationForSendFunction, countOfPacketsSent
    countOfPacketsSent+=1
    totalDurationForPacking +=(timeStamp1-timeStamp0)
    totalDurationForSendFunction +=(timeStamp2-timeStamp1)

async def send_binary_dataInBatch(websocket, path):
    print("send_binary_dataInBatch triggered. path=", path)
    for _ in range(NO_OF_FRAMES):
        await send_binary_data(websocket, path)  
    print(f"Average packing time {totalDurationForPacking/countOfPacketsSent} for {countOfPacketsSent} packets.")        
    print(f"Average send() call time {totalDurationForSendFunction/countOfPacketsSent} for {countOfPacketsSent} packets.")        

start_server = websockets.serve(send_binary_dataInBatch, "localhost", PORT, max_size=10_000_000) #127.0.0.1
asyncio.get_event_loop().run_until_complete(start_server)
print("Server is ready to send binary data. waiting for the client to request...")
asyncio.get_event_loop().run_forever()
print("Exiting server..")
   
