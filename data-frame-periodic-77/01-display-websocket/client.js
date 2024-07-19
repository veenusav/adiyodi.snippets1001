
const DATA_SERVER_PORT = 8183;

const ws = new WebSocket(`ws://localhost:${DATA_SERVER_PORT}`);
const startStreamingButton = document.getElementById('start-streaming');

startStreamingButton.addEventListener('click', () => {
  ws.send('START-STREAMING');
});

ws.onmessage = (event) => {
  // Handle incoming data frames here (e.g., display, process)
  console.log('Received frame:', event.data);
};

ws.onclose = () => {
  console.log('WebSocket connection closed.');
};
