import axios from 'axios';

type Dictionary<T> = {
[key: string]: T;
};

export async function callAxios( body: Dictionary<string|number|boolean>|{}, url : string){
    let callResponse = null;

    await axios.post('http://127.0.0.1:3333/'+url,body,{
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
