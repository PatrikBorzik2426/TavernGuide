<template>
    <div v-if="generalError.length > 0" class=" bg-primary h-16 w-fit p-4 fixed top-2 left-2 flex justify-center items-center text-center text-medium text-white rounded-md">
        <p>{{ generalError }}</p>
    </div>

    <form @submit.prevent="validateForm"  name="login-form" class=" flex flex-col w-5/12 text-white border-4 rounded-2xl border-primary p-8 animate-fade-right">
        <h2 class=" text-center font-bold text-5xl uppercase">Login & Explore</h2>

        <hr class=" h-1 bg-primary rounded-full border-none my-8">

        <div class=" flex flex-col gap-y-4 w-full">

            <div class=" w-full flex flex-col">
                <label for="username" class=" uppercase font-bold text-lg">Username</label>
                <input v-model="username" type="text" name="username" class=" my-2 px-2 py-1 h-10 bg-transparent border-[3px] border-primary rounded-md">
                <p class=" font-extralight text-red-500 animate-pulse animate-twice">{{ usernameError }}</p>
            </div>
            
            <div class=" w-full flex flex-col">
                <label for="password" class=" uppercase font-bold text-lg">Password</label>
                <input v-model="password" type="password" name="username" class=" my-2 px-2 py-1 h-10 bg-transparent border-[3px] border-primary rounded-md">
                <p class=" font-extralight text-red-500 animate-pulse animate-twice">{{ passwordError }}</p>
            </div>
            
        </div>

        <div class="flex justify-center items-center gap-4 mt-12">
            <button type="submit" class="px-4 py-2 w-fit border-[3px] border-primary bg-primary text-white font-extrabold uppercase rounded-md hover:bg-white hover:text-primary transition-colors hover:border-white" >Login</button>
            <button @click="emitChangeToRegister()" type="button" class="px-4 py-2 w-fit border-[3px] border-primary text-primary font-extrabold uppercase rounded-md hover:bg-white hover:text-primary transition-colors hover:border-white" >Register</button>
        </div>
    </form>
</template>


<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { callAxios } from '../services/axios.js' 
import { useRouter } from 'vue-router';


const emit = defineEmits(['register']);
const router = useRouter();

const username = ref<string>('');
const password = ref<string>('');

const usernameError = ref<string>('');
const passwordError = ref<string>('');
const generalError = ref<string>('');

function emitChangeToRegister(){
    emit('register', 'register');
}

async function validateForm() {
    if(username.value === ''){
        usernameError.value = 'Username is required';
    } else {
        usernameError.value = '';
    }

    if(password.value === ''){
        passwordError.value = 'Password is required';
    } else {
        passwordError.value = '';
    }

    if(usernameError.value === '' && passwordError.value === ''){
        const body = {
            username: username.value,
            password: password.value
        }
        
        const result = await callAxios(body, 'auth/login');

        if (result.status === 200){
            console.log("Assigning token to local storage");

            const token = result.token;
            localStorage.setItem('bearer', token.token);

            router.push('/dashboard');
        }else{
            console.error(result.message);

            generalError.value = result.message;

            username.value = '';
            password.value = '';

            setTimeout(() => {
                generalError.value = '';
            }, 5000);
        }

    }
    
}


</script>
