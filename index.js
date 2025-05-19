// const WebSocket = require('ws');
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

//     ws.on('message', (message) => {
//         console.log(`[${getTime()}] Received message: ${message}`);
//         ws.send(`[${getTime()}] Server response: You sent -> ${message}`);
//     });

//     ws.on('close', () => {
//         console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
//         notifyClientCount(); 
//     });
// });     

// console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const dotenv = require("dotenv");
const axios = require('axios');

dotenv.config();

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


let accessToken = null;
let accessTokenTimestamp = null;

const getAccessToken = async () => {
  if (accessToken && (Date.now() - accessTokenTimestamp) < 3500000) {
    return accessToken;
  }
  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });
    accessToken = response.data.access_token;
    accessTokenTimestamp = Date.now();
    return accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error.response ? JSON.stringify(error.response.data) : error.message);
    throw new Error(`Error refreshing access token: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
  }
};
wss.on('connection', ws => {   

    console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
    ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
    notifyClientCount();

    ws.on('message', async (message) => {
        console.log(`[${getTime()}] Received message: ${message}`);
    
        try {
            const parsedMessage = JSON.parse(message);
            const { userId, Userstatus } = parsedMessage;
    
            if (!userId || !Userstatus) {
                ws.send(`[${getTime()}] ❌ Invalid message format. 'userId' and 'Userstatus' required.`);
                return;
            }
    
            const payload = {
                userId,
                Userstatus
            };
    
            const result = await sendToZohoCatalystAPI(payload);  // no need to pass context here unless required
            ws.send(`[${getTime()}] ✅ Data sent to Zoho Catalyst successfully.`);
            console.log(`[${getTime()}] 🎉 Response from Zoho Catalyst:`, result);
        } catch (err) {
            console.error(`[${getTime()}] ❌ Error processing message:`, err.message);
            ws.send(`[${getTime()}] ❌ Failed to send data to Zoho Catalyst: ${err.message}`);
        }
    });

    ws.on('close', () => {
        console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
        notifyClientCount(); 
    });
});     

  

console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);

// // async function sendToZohoCatalystAPI(jsonData, context) {
// //     console.log('📤 Preparing to update JSON data in Zoho Catalyst DataStore...');
// //     try {
// //         const accessToken = await getAccessToken(context);
// //         console.log('🔑 Access token for Zoho Catalyst API:', accessToken ? 'Token retrieved' : 'No token');

// //         if (!accessToken) {
// //             throw new Error('No access token available for Zoho Catalyst API');
// //         }

// //         const { userId } = jsonData;
// //         if (!userId) {
// //             throw new Error("Missing 'userId' in jsonData. Cannot perform update.");
// //         }

// //         const zohoApiUrl = `https://api.catalyst.zoho.com/baas/v1/project/21031000006225557/table/USERS/row?where=userId.equals(${userId})`;

// //         console.log('🔄 Updating JSON data in Zoho Catalyst:', {
// //             url: zohoApiUrl,
// //             data: JSON.stringify(jsonData, null, 2)
// //         });

// //         const response = await axios.put(zohoApiUrl, jsonData, {
// //             headers: {
// //                 "Authorization": `Zoho-oauthtoken ${accessToken}`,
// //                 "Content-Type": "application/json"
// //             }
// //         });

// //         console.log('✅ JSON data updated in Zoho Catalyst successfully:', JSON.stringify(response.data, null, 2));
// //         return response.data;
// //     } catch (error) {
// //         console.error('❌ Error updating JSON data in Zoho Catalyst API:', {
// //             message: error.message,
// //             status: error.response?.status,
// //             data: error.response?.data,
// //             headers: error.response?.headers
// //         });
// //         throw new Error(`Failed to update JSON data in Zoho Catalyst API: ${error.message}`);
// //     }
// // }
// async function sendToZohoCatalystAPI(jsonData) {
//     console.log('📤 Preparing to update JSON data in Zoho Catalyst DataStore...');
//     try {
//         const accessToken = await getAccessToken();
//         console.log('🔑 Access token for Zoho Catalyst API:', accessToken ? 'Token retrieved' : 'No token');

//         if (!accessToken) {
//             throw new Error('No access token available for Zoho Catalyst API');
//         }

//         const { userId, Userstatus } = jsonData;
//         if (!userId || !Userstatus) {
//             throw new Error("Missing 'userId' or 'Userstatus' in jsonData. Cannot perform update.");
//         }

//         const projectId = '26027000000148001';
//         const tableName = 'USERS';

//         // Step 1: Fetch existing rows to find row_id
//         const fetchUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row?max_rows=200`;

//         const fetchResponse = await axios.get(fetchUrl, {
//             headers: {
//                 Authorization: `Zoho-oauthtoken ${accessToken}`,
//                 "Environment": "Development" // Corrected typo from "Enviroment" to "Environment"
//             }
//         });

//         const rows = fetchResponse.data.data;
//         const userRow = rows.find(row => row.userId === userId);
//         if (!userRow) {
//             throw new Error(`User with userId ${userId} not found.`);
//         }

//         const rowId = userRow.ROWID;
//         console.log('Matched user row:', userRow);
//         console.log('ROWID:', rowId);

//         // Step 2: Update the row with only ROWID and Userstatus
//         const updateUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row`;
//         const updatePayload = {
//             data: [
//                 {
//                     ROWID: rowId,
//                     Userstatus
//                 }
//             ]
//         };

//         console.log('🔄 Updating user record:', {
//             updatePayload
//         });

//         const updateResponse = await axios.put(updateUrl, updatePayload, {
//             headers: {
//                 Authorization: `Zoho-oauthtoken ${accessToken}`,
//                 "Content-Type": "application/json",
//                 "Environment": "Development" // Corrected typo
//             }
//         });

//         console.log('✅ User record updated successfully:', updateResponse.data);
//         return updateResponse.data;

//     } catch (error) {
//         console.error('❌ Error updating JSON data in Zoho Catalyst API:', {
//             message: error.message,
//             status: error.response?.status,
//             data: error.response?.data,
//             headers: error.response?.headers
//         });
//         throw new Error(`Failed to update JSON data in Zoho Catalyst API: ${error.message}`);
//     }
// }
async function sendToZohoCatalystAPI(jsonData) {
    console.log('📤 Preparing to update JSON data in Zoho Catalyst DataStore...');
    try {
        const accessToken = await getAccessToken();
        console.log('🔑 Access token for Zoho Catalyst API:', accessToken ? 'Token retrieved' : 'No token');
        if (!accessToken) {
            throw new Error('No access token available for Zoho Catalyst API');
        }
        const { userId, Userstatus } = jsonData;
        if (!userId || !Userstatus) {
            throw new Error("Missing 'userId' or 'Userstatus' in jsonData. Cannot perform update.");
        }
        const projectId = '26027000000148001';
        const tableName = 'USERS';
        const fetchUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row?max_rows=200`;

        const fetchResponse = await axios.get(fetchUrl, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                "Environment": "Development"
            }
        });
        const rows = fetchResponse.data.data;
        const userRow = rows.find(row => row.userId === userId);
        if (!userRow) {
            throw new Error(`User with userId ${userId} not found.`);
        }
        const rowId = userRow.ROWID;
        console.log('Matched user row:', userRow);
        console.log('ROWID:', rowId);
        const updateUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row`;
        const updatePayload = [
            {
                ROWID: rowId,
                Userstatus // Ensure this matches the exact column name in the table
            }
        ];
        console.log('🔄 Updating user record:', { updatePayload });

        const updateResponse = await axios.put(updateUrl, updatePayload, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/json",
                "Environment": "Development"
            }
        });

        console.log('✅ User record updated successfully:', updateResponse.data);
        return updateResponse.data;

    } catch (error) {
        console.error('❌ Error updating JSON data in Zoho Catalyst API:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        throw new Error(`Failed to update JSON data in Zoho Catalyst API: ${error.message}`);
    }
}
