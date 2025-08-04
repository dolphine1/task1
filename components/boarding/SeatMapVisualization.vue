<template>
  <div class="p-4">
    <!-- Vehicle Layout -->
    <div class="max-w-md mx-auto">
      <!-- Driver Section -->
      <div class="mb-6">
        <div class="flex justify-center mb-2">
          <div class="w-16 h-12 bg-gray-300 rounded-t-lg flex items-center justify-center">
            <UIcon name="i-heroicons-truck" class="w-6 h-6 text-gray-600" />
          </div>
        </div>
        <p class="text-center text-sm text-gray-500">Driver</p>
      </div>

      <!-- Seat Grid -->
      <div class="space-y-3">
        <div
          v-for="row in seatRows"
          :key="row"
          class="flex justify-center space-x-2"
        >
          <!-- Left Seats (A, B) -->
          <div class="flex space-x-1">
            <BoardingSeatButton
              :seat-number="`${row}A`"
              :status="getSeatStatus(`${row}A`)"
              :passenger="getPassengerForSeat(`${row}A`)"
              @click="handleSeatClick(`${row}A`)"
            />
            <BoardingSeatButton
              :seat-number="`${row}B`"
              :status="getSeatStatus(`${row}B`)"
              :passenger="getPassengerForSeat(`${row}B`)"
              @click="handleSeatClick(`${row}B`)"
            />
          </div>

          <!-- Aisle -->
          <div class="w-8 flex items-center justify-center">
            <div class="w-1 h-8 bg-gray-200 rounded"></div>
          </div>

          <!-- Right Seats (C, D) -->
          <div class="flex space-x-1">
            <BoardingSeatButton
              :seat-number="`${row}C`"
              :status="getSeatStatus(`${row}C`)"
              :passenger="getPassengerForSeat(`${row}C`)"
              @click="handleSeatClick(`${row}C`)"
            />
            <BoardingSeatButton
              :seat-number="`${row}D`"
              :status="getSeatStatus(`${row}D`)"
              :passenger="getPassengerForSeat(`${row}D`)"
              @click="handleSeatClick(`${row}D`)"
            />
          </div>
        </div>
      </div>

      <!-- Legend -->
      <!-- <div class="mt-8 space-y-3"> -->
        <h4 class="font-medium text-gray-900">Seat Status Legend</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-green-500 border-2 border-green-600 rounded-lg shadow-sm"></div>
            <span class="font-medium text-gray-700">Available</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-blue-500 border-2 border-blue-600 rounded-lg shadow-sm"></div>
            <span class="font-medium text-gray-700">Regular Assigned</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-purple-500 border-2 border-purple-600 rounded-lg shadow-sm"></div>
            <span class="font-medium text-gray-700">VIP Passenger</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-orange-500 border-2 border-orange-600 rounded-lg shadow-sm"></div>
            <span class="font-medium text-gray-700">Elderly/Disabled</span>
          </div>
        </div>
        
      <!-- Stats -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-lg font-bold text-green-600">{{ availableSeats.length }}</div>
            <div class="text-xs text-gray-500">Available</div>
          </div>
          <div>
            <div class="text-lg font-bold text-blue-600">{{ assignedSeats.length }}</div>
            <div class="text-xs text-gray-500">Assigned</div>
          </div>
          <div>
            <div class="text-lg font-bold text-gray-600">{{ totalSeats }}</div>
            <div class="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define the passenger priority type locally
type PassengerType = 'vip' | 'elderly' | 'regular' | 'standby'

interface PassengerPriority {
  id: string
  name: string
  type: PassengerType
  arrivalTime: Date
  seatPreference?: string
}

// Props
interface Props {
  seatAssignments: Array<{ seatNumber: string; passengerId: string }>
  passengers: PassengerPriority[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  seatSelected: [seatNumber: string]
}>()

// Constants
const totalRows = 8  // 8 rows with 4 seats each = 32 seats total
const seatsPerRow = 4
const totalSeats = totalRows * seatsPerRow

// Computed
const seatRows = computed(() => {
  return Array.from({ length: totalRows }, (_, i) => i + 1)
})

const assignedSeats = computed(() => {
  return props.seatAssignments.map(a => a.seatNumber)
})

const availableSeats = computed(() => {
  const allSeats: string[] = []
  for (let row = 1; row <= totalRows; row++) {
    for (const letter of ['A', 'B', 'C', 'D']) {
      const seatNumber = `${row}${letter}`
      if (!assignedSeats.value.includes(seatNumber)) {
        allSeats.push(seatNumber)
      }
    }
  }
  return allSeats
})

// Methods
const getSeatStatus = (seatNumber: string): 'available' | 'assigned' | 'vip' | 'elderly' | 'standby' => {
  const assignment = props.seatAssignments.find(a => a.seatNumber === seatNumber)
  if (!assignment) return 'available'
  
  const passenger = props.passengers.find(p => p.id === assignment.passengerId)
  if (!passenger) return 'assigned'
  
  if (passenger.type === 'vip') return 'vip'
  if (passenger.type === 'elderly') return 'elderly'
  if (passenger.type === 'standby') return 'standby'
  return 'assigned'
}

const getPassengerForSeat = (seatNumber: string): PassengerPriority | undefined => {
  const assignment = props.seatAssignments.find(a => a.seatNumber === seatNumber)
  if (!assignment) return undefined
  return props.passengers.find(p => p.id === assignment.passengerId)
}

const handleSeatClick = (seatNumber: string) => {
  if (getSeatStatus(seatNumber) === 'available') {
    emit('seatSelected', seatNumber)
  }
}
</script>