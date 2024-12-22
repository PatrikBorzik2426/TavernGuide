<template>
  <component class=" font-manrope " :is="chosenComponent" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { callAxios } from '~/services/axios';
import type { User } from '~/models/User';
import DmEditorComponent from '~/components/DmEditorComponent.vue';
import PlayerEditorComponent from '~/components/PlayerEditorComponent.vue';
import type { Component } from 'vue';

const router = useRouter();
const currentUser = ref<User | null>(null);
const currentDmId = ref<number | null>(null);
const campaign_id = Number(router.currentRoute.value.query.campaign_id) || null;

const chosenComponent = ref<Component | null>(null);

onMounted(async () => {
  console.log('Campaign ID:', campaign_id);

  // Authenticate user
  const result = await callAxios({}, 'auth/simpleAuth');
  if (result.status === 200) {
    currentUser.value = result.user;
  } else {
    router.push('/auth'); // Ensure you use the correct path
    return;
  }

  // Get DM ID for the campaign
  if (campaign_id) {
    const resultDm = await callAxios({ campaign_id }, 'campaigns/getDm');
    if (resultDm.status === 200) {
      currentDmId.value = resultDm.dm_id;
    }
  }

  // Set the chosen component based on user role
  if (currentUser.value?.id === currentDmId.value) {
    chosenComponent.value = DmEditorComponent;
  } else {
    chosenComponent.value = PlayerEditorComponent;
  }
});
</script>
