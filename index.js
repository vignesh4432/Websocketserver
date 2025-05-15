// // const Websocket = require('ws');
// // const wss = new Websocket.Server({ port: 8080 });

// // wss.on('connection', ws => {
// //     console.log(`new client connected, total no of clients: ${wss.clients.size} `);
// //     ws.send('Welcome to the WebSocket server!');
// //     ws.on('message', (message) => {
// //         console.log(`Received message: ${message}`);
// //         ws.send(`Server response :You sent -> ${message}`);
// //         });
// //         setInterval(() => {
// //             ws.send('total no of clients:'+wss.clients.size+' clients connected');
// //         }, 5000);
// //         ws.on('close', () => 
// //             console.log(`client disconnected, total no of clients: ${wss.clients.size}`));
        
// //     });
// // console.log('WebSocket server is running on ws://localhost:8080');





// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 8080 });

// function getTime() {
//     return new Date().toLocaleTimeString();
// }

// wss.on('connection', ws => {
//     console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
//     ws.send(`[${getTime()}] Welcome to the WebSocket server!`);

//     ws.on('message', (message) => {
//         console.log(`[${getTime()}] Received message: ${message}`);
//         ws.send(`[${getTime()}] Server response: You sent -> ${message}`);
//     });

//     const interval = setInterval(() => { 
//         if (ws.readyState === WebSocket.OPEN) {
//             // ws.send(`[${getTime()}] Total clients connected: ${wss.clients.size}`);
//         }
//     }, 5000);

//     ws.on('close', () => {
//         clearInterval(interval);
//         console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
//     });
// });

// console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

function getTime() {
    return new Date().toLocaleTimeString();
}

function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function notifyClientCount() {
    const message = `[${getTime()}] Total clients connected: ${wss.clients.size}`;
    broadcast(message);
}

wss.on('connection', ws => {   

    console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
    ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
    notifyClientCount();

    ws.on('message', (message) => {
        console.log(`[${getTime()}] Received message: ${message}`);
        ws.send(`[${getTime()}] Server response: You sent -> ${message}`);
    });

    ws.on('close', () => {
        console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
        notifyClientCount(); 
    });
});     

console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);
























