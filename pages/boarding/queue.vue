<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Boarding Queue Management</h1>
          <p class="text-gray-600 mt-2">Priority-based passenger boarding system</p>
        </div>
        <div class="flex items-center space-x-4">
          <UBadge :color="queueSize > 0 ? 'blue' : 'gray'" variant="solid" size="lg">
            {{ queueSize }} in queue
          </UBadge>
          <UButton 
            v-if="nextPassenger" 
            @click="boardNext"
            :loading="isLoading"
            color="primary"
            size="lg"
          >
            Board Next Passenger
          </UButton>
        </div>
      </div>

      <!-- Error Display -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="error"
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
        @close="clearError"
      />

      <!-- Success Message -->
      <UAlert
        v-if="lastBoardedPassenger"
        icon="i-heroicons-check-circle"
        color="green"
        variant="soft"
        :title="`${lastBoardedPassenger.name} has been successfully boarded!`"
        :description="`Assigned to seat ${lastBoardedPassenger.assignedSeat}`"
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
        @close="lastBoardedPassenger = null"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Passenger Check-in Form -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                <UIcon name="i-heroicons-user-plus" class="w-5 h-5 mr-2" />
                Passenger Check-in
              </h2>
            </template>

            <UForm :state="form" @submit="handleAddPassenger" class="space-y-4">
              <UFormGroup label="Passenger Name" name="name" required>
                <UInput 
                  v-model="form.name" 
                  placeholder="Enter passenger name"
                  :disabled="isLoading"
                />
              </UFormGroup>

              <UFormGroup label="Passenger Type" name="type" required>
                <USelect 
                  v-model="form.type" 
                  :options="passengerTypeOptions"
                  :disabled="isLoading"
                />
              </UFormGroup>

              <UFormGroup label="Seat Preference (Optional)" name="seatPreference">
                <USelect 
                  v-model="form.seatPreference" 
                  :options="seatOptions"
                  placeholder="Select preferred seat"
                  :disabled="isLoading"
                />
              </UFormGroup>

              <UButton 
                type="submit" 
                :loading="isLoading"
                block
                size="lg"
              >
                Check In Passenger
              </UButton>
            </UForm>
          </UCard>

          <!-- Next Passenger Card -->
          <UCard v-if="nextPassenger" class="mt-6">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <UIcon name="i-heroicons-arrow-right-circle" class="w-5 h-5 mr-2" />
                Next to Board
              </h3>
            </template>

            <div class="flex items-center space-x-4">
              <UAvatar
                :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(nextPassenger.name)}&background=${getTypeColor(nextPassenger.type)}&color=fff`"
                :alt="nextPassenger.name"
                size="lg"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ nextPassenger.name }}</p>
                <div class="flex items-center space-x-2 mt-1">
                  <UBadge
                    :color="getTypeColor(nextPassenger.type)"
                    variant="soft"
                    size="sm"
                  >
                    {{ nextPassenger.type.toUpperCase() }}
                  </UBadge>
                  <span class="text-sm text-gray-500">
                    Arrived: {{ formatTime(nextPassenger.arrivalTime) }}
                  </span>
                </div>
                <p v-if="nextPassenger.seatPreference" class="text-sm text-blue-600 mt-1">
                  Prefers: {{ nextPassenger.seatPreference }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Queue Display and Seat Map -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Queue Display -->
          <BoardingQueueDisplay
            :passengers="[...passengers]"
            :seat-assignments="[...seatAssignments]"
            :is-loading="isLoading"
            @remove-passenger="handleRemovePassenger"
          />

          <!-- Seat Map Visualization -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 mr-2" />
                Seat Map
              </h2>
            </template>

            <BoardingSeatMapVisualization
              :seat-assignments="seatAssignments.map((sa: any) => ({ seatNumber: sa.seatId, passengerId: sa.passengerId }))"
              :passengers="[...passengers]"
              @seat-selected="handleSeatSelected"
            />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useBoardingQueue, type NewPassengerData, type Passenger } from '~/composables/useBoardingQueue'

// Components are auto-imported in Nuxt 3
const vehicleId = 'vehicle_001'

// Use the boarding queue composable
const {
  passengers,
  isLoading,
  error,
  seatAssignments,
  queueSize,
  nextPassenger,
  availableSeats,
  addPassenger,
  boardNextPassenger,
  removePassenger,
  clearError
} = useBoardingQueue(vehicleId)

// Form state
const form = reactive<NewPassengerData>({
  name: '',
  type: 'regular',
  seatPreference: undefined
})

// Last boarded passenger for success message
const lastBoardedPassenger = ref<Passenger | null>(null)

// Passenger type options
const passengerTypeOptions = [
  { label: 'VIP Passenger', value: 'vip' },
  { label: 'Elderly/Disabled', value: 'elderly' },
  { label: 'Regular Passenger', value: 'regular' },
  { label: 'Standby Passenger', value: 'standby' }
]

// Available seat options for the dropdown
const seatOptions = computed(() => 
  availableSeats.value.map((seat: string) => ({ label: seat, value: seat }))
)

// Methods
const handleAddPassenger = async () => {
  if (!form.name.trim()) return
  
  const passenger = await addPassenger(form)
  if (passenger) {
    // Reset form
    form.name = ''
    form.seatPreference = undefined
    form.type = 'regular'
  }
}

const boardNext = async () => {
  const boardedPassenger = await boardNextPassenger()
  if (boardedPassenger) {
    lastBoardedPassenger.value = boardedPassenger
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      lastBoardedPassenger.value = null
    }, 5000)
  }
}

const handleRemovePassenger = async (passengerId: string) => {
  await removePassenger(passengerId)
}

const handleSeatSelected = (seatNumber: string) => {
  form.seatPreference = seatNumber
}

// Utility functions
const getTypeColor = (type: string) => {
  const colors = {
    vip: 'purple',
    elderly: 'blue',
    regular: 'green',
    standby: 'orange'
  }
  return colors[type as keyof typeof colors] || 'gray'
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>
