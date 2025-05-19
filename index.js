// // // const WebSocket = require('ws');
// // // const wss = new WebSocket.Server({ port: 8080 });

// // // function getTime() {
// // //     return new Date().toLocaleTimeString();
// // // }

// // // function broadcast(message) {
// // //     wss.clients.forEach(client => {
// // //         if (client.readyState === WebSocket.OPEN) {
// // //             client.send(message);
// // //         }
// // //     });
// // // }

// // // function notifyClientCount() {
// // //     const message = `[${getTime()}] Total clients connected: ${wss.clients.size}`;
// // //     broadcast(message);
// // // }

// // // wss.on('connection', ws => {   

// // //     console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
// // //     ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
// // //     notifyClientCount();

// // //     ws.on('message', (message) => {
// // //         console.log(`[${getTime()}] Received message: ${message}`);
// // //         ws.send(`[${getTime()}] Server response: You sent -> ${message}`);
// // //     });

// // //     ws.on('close', () => {
// // //         console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);
// // //         notifyClientCount(); 
// // //     });
// // // });     

// // // console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);

// const WebSocket = require('ws');
// const url = require('url');
// const wss = new WebSocket.Server({ port: 8080 });
// const dotenv = require("dotenv");
// const axios = require('axios');

// dotenv.config();

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

// let accessToken = null;
// let accessTokenTimestamp = null;

// const getAccessToken = async () => {
//     if (accessToken && (Date.now() - accessTokenTimestamp) < 3500000) {
//         return accessToken;
//     }
//     try {
//         const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
//             params: {
//                 refresh_token: process.env.ZOHO_REFRESH_TOKEN,
//                 client_id: process.env.ZOHO_CLIENT_ID,
//                 client_secret: process.env.ZOHO_CLIENT_SECRET,
//                 grant_type: 'refresh_token'
//             }
//         });
//         accessToken = response.data.access_token;
//         accessTokenTimestamp = Date.now();
//         return accessToken;
//     } catch (error) {
//         console.error("Error refreshing access token:", error.response ? JSON.stringify(error.response.data) : error.message);
//         throw new Error(`Error refreshing access token: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
//     }
// };

// wss.on('connection', (ws, req) => {   

//     const query = url.parse(req.url, true).query;
//     const userId = query.userId;
    
//     if (userId) {
//         ws.userId = userId;
//         console.log(`[${getTime()}] New client connected with userId: ${userId}, total clients: ${wss.clients.size}`);
//     } else {
//         console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
//     }

//     ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
//     notifyClientCount();

//     ws.on('message', async (message) => {
//         console.log(`[${getTime()}] Received message: ${message}`);
    
//         try {
//             const parsedMessage = JSON.parse(message);
//             const { userId: messageUserId, Userstatus } = parsedMessage;
    
//             if (!messageUserId || !Userstatus) {
//                 ws.send(`[${getTime()}] ❌ Invalid message format. 'userId' and 'Userstatus' required.`);
//                 return;
//             }

//             ws.userId = messageUserId;
    
//             const payload = {
//                 userId: messageUserId,
//                 Userstatus
//             };
    
//             const result = await sendToZohoCatalystAPI(payload);
//             ws.send(`[${getTime()}] ✅ Data sent to Zoho Catalyst successfully.`);
//             console.log(`[${getTime()}] 🎉 Response from Zoho Catalyst:`, result);
//         } catch (err) {
//             console.error(`[${getTime()}] ❌ Error processing message:`, err.message);
//             ws.send(`[${getTime()}] ❌ Failed to send data to Zoho Catalyst: ${err.message}`);
//         }
//     });

//     ws.on('close', async () => {
//         console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);

//         if (ws.userId) {
//             try {
//                 const payload = {
//                     userId: ws.userId,
//                     Userstatus: 'Inactive' 
//                 };
//                 const result = await sendToZohoCatalystAPI(payload);
//                 console.log(`[${getTime()}] ✅ Data sent to Zoho Catalyst on close for user ${ws.userId}:`, result);
//             } catch (err) {
//                 console.error(`[${getTime()}] ❌ Error sending data to Zoho Catalyst on close for user ${ws.userId}:`, err.message);
//             }
//         } else {
//             console.log(`[${getTime()}] No userId associated with this client, skipping Zoho Catalyst update.`);
//         }
        
//         notifyClientCount(); 
//     });
// });     

// console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);

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
//         const projectId = '21031000006225557';
//         const tableName = 'USERS';
//         const fetchUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row?max_rows=200`;

//         const fetchResponse = await axios.get(fetchUrl, {
//             headers: {
//                 Authorization: `Zoho-oauthtoken ${accessToken}`,
//                 "Environment": "Development"
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
//         const updateUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row`;
//         const updatePayload = [
//             {
//                 ROWID: rowId,
//                 Userstatus 
//             }
//         ];
//         console.log('🔄 Updating user record:', { updatePayload });

//         const updateResponse = await axios.put(updateUrl, updatePayload, {
//             headers: {
//                 Authorization: `Zoho-oauthtoken ${accessToken}`,
//                 "Content-Type": "application/json",
//                 "Environment": "Development"
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
// const addRowToZohoSheet = async (fileResourceID, sheetName, rowData, req) => {
//     try {
//         const accessToken = await getAccessToken(req);
//         const endpointURL = `https://sheet.zoho.com/api/v2/${fileResourceID}`;
//         const headers = {
//         'Authorization': `Zoho-oauthtoken ${accessToken}`,
//         'Content-Type': 'application/x-www-form-urlencoded'
//         };
//         const data = {
//         method: 'worksheet.jsondata.append',
//         worksheet_name: sheetName,
//         json_data: JSON.stringify(rowData) 
//         };

//         const response = await axios.post(endpointURL, qs.stringify(data), { headers });
//         return response.data;
//     } catch (error) {
//         console.error('Error adding new row to Zoho Sheets:', error.response ? JSON.stringify(error.response.data) : error.message);
//         throw new Error(`Error adding new row to Zoho Sheets: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
//     }
// };


const WebSocket = require('ws');
const url = require('url');
const wss = new WebSocket.Server({ port: 8080 });
const dotenv = require("dotenv");
const axios = require('axios');
const qs = require('querystring');

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

async function addRowToZohoSheet(fileResourceID, sheetName, rowData) {
    try {
        const accessToken = await getAccessToken();
        const endpointURL = `https://sheet.zoho.com/api/v2/${fileResourceID}`;
        const headers = {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const data = {
            method: 'worksheet.jsondata.append',
            worksheet_name: sheetName,
            json_data: JSON.stringify([rowData]) // Wrap in array for Zoho Sheet
        };

        const response = await axios.post(endpointURL, qs.stringify(data), { headers });
        console.log('✅ Row added to Zoho Sheet successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error adding new row to Zoho Sheets:', error.response ? JSON.stringify(error.response.data) : error.message);
        throw new Error(`Error adding new row to Zoho Sheets: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

async function logAgentActivity(jsonData, userFirstName) {
    console.log('📤 Preparing to log activity in AgentActivity table and Zoho Sheet...');
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('No access token available for Zoho Catalyst API');
        }
        const { userId, Userstatus } = jsonData;
        if (!userId || !Userstatus) {
            throw new Error("Missing 'userId' or 'Userstatus' in jsonData. Cannot log activity.");
        }
        const projectId = '21031000006225557';
        const tableName = 'AgentActivity';
        const insertUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row`;
        const rowData = {
            userId,
            Status: Userstatus,
            logtimestamp: new Date().toISOString(),
            UserFirstName: userFirstName
        };
        const insertPayload = [rowData];
        console.log('🔄 Inserting activity record to AgentActivity:', { insertPayload });

        const insertResponse = await axios.post(insertUrl, insertPayload, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/json",
                "Environment": "Development"
            }
        });

        console.log('✅ Activity record inserted successfully:', insertResponse.data);
        const fileResourceID = process.env.ZOHO_RESOURCE_ID;
        const sheetName = process.env.ZOHO_WORKSHEET_NAME5;
        await addRowToZohoSheet(fileResourceID, sheetName, rowData);

        return insertResponse.data;
    } catch (error) {
        console.error('❌ Error logging activity:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        throw new Error(`Failed to log activity: ${error.message}`);
    }
}

wss.on('connection', (ws, req) => {   
    const query = url.parse(req.url, true).query;
    const userId = query.userId;
    
    if (userId) {
        ws.userId = userId;
        console.log(`[${getTime()}] New client connected with userId: ${userId}, total clients: ${wss.clients.size}`);
    } else {
        console.log(`[${getTime()}] New client connected, total clients: ${wss.clients.size}`);
    }

    ws.send(`[${getTime()}] Welcome to the WebSocket server!`);
    notifyClientCount();

    ws.on('message', async (message) => {
        console.log(`[${getTime()}] Received message: ${message}`);
    
        try {
            const parsedMessage = JSON.parse(message);
            const { userId: messageUserId, Userstatus } = parsedMessage;
    
            if (!messageUserId || !Userstatus) {
                ws.send(`[${getTime()}] ❌ Invalid message format. 'userId' and 'Userstatus' required.`);
                return;
            }

            ws.userId = messageUserId;
    
            const payload = {
                userId: messageUserId,
                Userstatus
            };
    
            const result = await sendToZohoCatalystAPI(payload);
            ws.send(`[${getTime()}] ✅ Data sent to Zoho Catalyst successfully.`);
            console.log(`[${getTime()}] 🎉 Response from Zoho Catalyst:`, result);
        } catch (err) {
            console.error(`[${getTime()}] ❌ Error processing message:`, err.message);
            ws.send(`[${getTime()}] ❌ Failed to send data to Zoho Catalyst: ${err.message}`);
        }
    });

    ws.on('close', async () => {
        console.log(`[${getTime()}] Client disconnected, total clients: ${wss.clients.size}`);

        if (ws.userId) {
            try {
                const payload = {
                    userId: ws.userId,
                    Userstatus: 'Inactive'
                };
                const result = await sendToZohoCatalystAPI(payload);
                console.log(`[${getTime()}] ✅ Data sent to Zoho Catalyst on close for user ${ws.userId}:`, result);
            } catch (err) {
                console.error(`[${getTime()}] ❌ Error sending data to Zoho Catalyst on close for user ${ws.userId}:`, err.message);
            }
        } else {
            console.log(`[${getTime()}] No userId associated with this client, skipping Zoho Catalyst update.`);
        }
        
        notifyClientCount(); 
    });
});     

console.log(`[${getTime()}] WebSocket server is running on ws://localhost:8080`);

async function sendToZohoCatalystAPI(jsonData) {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('No access token available for Zoho Catalyst API');
        }
        const { userId, Userstatus } = jsonData;
        if (!userId || !Userstatus) {
            throw new Error("Missing 'userId' or 'Userstatus' in jsonData. Cannot perform update.");
        }
        const projectId = '21031000006225557';
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
        const userFirstName = userRow.UserFirstName; 
        const updateUrl = `https://api.catalyst.zoho.com/baas/v1/project/${projectId}/table/${tableName}/row`;
        const updatePayload = [
            {
                ROWID: rowId,
                Userstatus 
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
        await logAgentActivity(jsonData, userFirstName);

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