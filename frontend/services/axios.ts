import axios from 'axios';

type Dictionary<T> = {
[key: string]: T;
};

export async function callAxios( body: Dictionary<string|number|boolean>|{}, url : string){
    let callResponse = null;
    console.log("Before axios call");

    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://localhost:3333/'  // For local access
    : 'https://192.168.1.177:3333/'  // For external devices

    console.log("Used URL: " + apiBaseUrl);

    //127.0.0.1
    await axios.post(apiBaseUrl+url,body,{
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('bearer'),
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        callResponse = response.data;
    }).catch((err) => {
        callResponse = err;
    });
   
    return callResponse;
}
