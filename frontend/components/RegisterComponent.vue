<template>
    <div v-if="generalError.length > 0" class=" bg-primary h-16 w-fit p-4 fixed top-2 left-2 flex justify-center items-center text-center text-medium text-white rounded-md">
        <p>{{ generalError }}</p>
    </div>

    <form @submit.prevent="validateForm" class=" flex flex-col w-6/12 h-fit text-white border-4 rounded-2xl border-primary p-8 animate-fade-left">
        <h2 class=" text-center font-bold text-5xl uppercase">Adventure Awaits</h2>

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

            <div class=" w-full flex flex-col">
                <label for="email" class=" uppercase font-bold text-lg">E-mail</label>
                <input v-model="email" type="text" name="email" class=" my-2 px-2 py-1 h-10 bg-transparent border-[3px] border-primary rounded-md">
                <p class=" font-extralight text-red-500 animate-pulse animate-twice">{{ emailError }}</p>
            </div>
            
        </div>

        <div class="flex justify-center items-center gap-4 mt-12">
            <button type="submit" class="px-4 py-2 w-fit border-[3px] border-primary bg-primary text-white font-extrabold uppercase rounded-md hover:bg-white hover:text-primary transition-colors hover:border-white" >Register</button>
            <button @click="emitChangeToLogin()" type="button" class="px-4 py-2 w-fit border-[3px] border-primary text-primary font-extrabold uppercase rounded-md hover:bg-white hover:text-primary transition-colors hover:border-white" >Login</button>
        </div>
    </form>
</template>


<script setup lang="ts">

// Prepare emitting data to parent component
import { ref, defineEmits } from 'vue';
import { callAxios } from '../services/axios.js' 
import { useRouter } from 'vue-router';

const emit = defineEmits(['login']);
const router = useRouter();

const username = ref<string>('');
const password = ref<string>('');
const email = ref<string>('');

const usernameError = ref<string>('');
const passwordError = ref<string>('');
const emailError = ref<string>('');

const generalError = ref<string>('');


// Emit data to parent component expect @login event
function emitChangeToLogin(){
    emit('login','login');
}

async function submitRegisterForm(){
    console.log("Submitting form");

    const body = { 
        username: username.value,
        password: password.value,
        email: email.value
    }
    
    const result = await callAxios(body, 'auth/register')

    if (result){
        console.log(result);

        if (result.status !== 200){
            console.error(result.message);
            
            username.value = '';
            password.value = '';
            email.value = '';

            generalError.value = result.message;

            setTimeout(() => {
                generalError.value = '';
            }, 5000);

        }else{
            console.log("Assigning token to local storage");

            const token = result.token;
            localStorage.setItem('bearer', token.token);

            router.push('/dashboard');
        }
    }
}

async function validateForm(){
    console.log("Validating form");

    if(username.value === '' || password.value === '' || email.value === ''){

        if(username.value === ''){
            usernameError.value = "Username is required";
        }

        if(password.value === ''){
            passwordError.value = "Password is required";
        }else{
            // manual check of password length
            if(password.value.length < 8){
                passwordError.value = "Password must be at least 8 characters long";
            }else{
                passwordError.value = '';
            }
        }

        if(email.value === ''){
            emailError.value = "Email is required";
        }else{
            // manual check of email format via regex
            if(!validateEmail(email.value)){
                emailError.value = "Invalid email format";
            }else{
                emailError.value = '';
            }
        }

        return false;
    }

    await submitRegisterForm();

    return true;
}

function validateEmail(email: string){
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

</script>
