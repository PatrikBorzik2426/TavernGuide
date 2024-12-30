import axios from 'axios';

type Dictionary<T> = {
[key: string]: T;
};

export async function callAxios( body: Dictionary<string|number|boolean>|{}, url : string){
    let callResponse = null;
    console.log("Before axios call");

    const apiBaseUrl = 'https://88.198.78.177:3333/';

    console.log("Used URL: " + apiBaseUrl+url);

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
