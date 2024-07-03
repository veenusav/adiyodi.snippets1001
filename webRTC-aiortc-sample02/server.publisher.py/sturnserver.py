STUNPORT=3478
import asyncio
from aioice import Candidate, Connection, stun
print(".vav.stun server begin")
async def handle_stun(reader, writer):
    request = await stun.parse_message(reader)
    print(".vav.stun handle_stun cb. request:", request)
    if request.method == 'binding':
        response = stun.create_success_response(request)
        print(".vav.stun binding response:", response)
        await stun.send_message(response, writer)

async def main():
    server = await asyncio.start_server(handle_stun, '0.0.0.0', STUNPORT)
    print(".vav.stun server initiated. PORT:", STUNPORT)
    async with server:
        await server.serve_forever()

if __name__ == '__main__':
    asyncio.run(main())



# import asyncio
# from aioice import Connection

# async def stun_server():
#     conn = Connection(ice_lite=True)  # ice_lite=True for STUN-only server
#     await conn.run()

# async def main():
#     await asyncio.gather(
#         stun_server()
#     )

# if __name__ == '__main__':
#     asyncio.run(main())


# import asyncio
# from aioice import StunServer

# async def stun_server():
#     server = StunServer()
#     await server.run()

# async def main():
#     await asyncio.gather(
#         stun_server()
#     )

# if __name__ == '__main__':
#     asyncio.run(main())

# import asyncio
# from aioice.stun import build_stun_server

# async def stun_server():
#     _, protocol = await asyncio.start_udp_server(lambda: build_stun_server(), ('0.0.0.0', 3478))
#     print(f'STUN server listening on {protocol.sockets[0].getsockname()}')

#     async for request in protocol:
#         try:
#             response = await request.process()
#             await protocol.send(response)
#         except Exception as exc:
#             print(f'Error processing STUN request: {exc}')

# async def main():
#     await asyncio.gather(
#         stun_server()
#     )

# if __name__ == '__main__':
#     asyncio.run(main())

# import asyncio
# from aioice import stun

# async def stun_server():
    
#     udp_server = await stun.create_stun_server(local_addr=('0.0.0.0', 3478))
#     print(f'STUN server listening on {udp_server.sockets[0].getsockname()}')

#     async for request in udp_server.recv():
#         if isinstance(request, stun.Message) and request.class_ == stun.Class.REQUEST and request.method == stun.Method.BINDING:
#             response = stun.Message(cla=stun.Class.RESPONSE, method=stun.Method.BINDING, transaction_id=request.transaction_id)
#             response.add_attr(stun.XorMappedAddressAttribute.from_host_port(request.addr))
#             await udp_server.send(response, request.addr)

# async def main():
#     await asyncio.gather(
#         stun_server()
#     )

# if __name__ == '__main__':
#     asyncio.run(main())

# import asyncio
# from aiortc import RTCIceServer, RTCIceCandidate
# from aiortc.stun import build_stun_server

# async def handle_stun_request(request, response):
#     if request.method == 'BINDING':
#         xor_address = request.xor_address
#         print(f'Received STUN request from {xor_address}')
#         response.set_address(xor_address)

# async def stun_server():
#     stun = await build_stun_server(bind_address='0.0.0.0', bind_port=3478)
#     stun.add_handler(handle_stun_request)
#     print(f'STUN server listening on {stun.bind_address}:{stun.bind_port}')

#     await stun.run()

# async def main():
#     await asyncio.gather(
#         stun_server()
#     )

# if __name__ == '__main__':
#     asyncio.run(main())
