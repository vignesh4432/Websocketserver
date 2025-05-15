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


// const WebSocket = require('ws');
// const axios = require('axios');
// const wss = new WebSocket.Server({ port: 8080 });

// function getTime() {
//     return new Date().toLocaleTimeString();
// }

// function broadcast(message) {
//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(message);
//         }
//     });
// }

// function notifyClientCount() {
//     const message = `[${getTime()}] Total clients connected: ${wss.clients.size}`;
//     broadcast(message);
// }

// wss.on('connection', ws => {   
//     console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
//     ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
//     notifyClientCount();

//     ws.on('message', async (message) => {
//         console.log(`[${getTime()}] Received message: ${message}`);
        
//         try {
//             const data = JSON.parse(message);
//             const { userId, Userstatus, accessToken } = data;

//             if (!userId || !Userstatus || !accessToken) {
//                 ws.send(`[${getTime()}] Error: Missing required fields (userId, Userstatus, or accessToken)`);
//                 return;
//             }

//             const payload = [{ userId, Userstatus }];

//             const response = await axios.put('https://salesjet-10097049716.development.catalystappsail.com/userdatastatus', payload, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`
//                 }
//             });
//             if (response.status === 200) {
//                 ws.send(`[${getTime()}] Server response: Data sent to API successfully -> ${JSON.stringify(response.data)}`);
//             } else {
//                 ws.send(`[${getTime()}] Error: Failed to send data to API -> ${response.statusText}`);
//             }
//         } catch (error) {
//             console.error(`[${getTime()}] Error processing message: ${error.message}`);
//             ws.send(`[${getTime()}] Server error: ${error.message}`);
//         }
//     });

//     ws.on('close', () => {
//         console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
//         notifyClientCount(); 
//     });
// });     

// console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);
