import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

export interface Passenger {
  id: string
  name: string
  type: 'vip' | 'elderly' | 'regular' | 'standby'
  arrivalTime: Date
  seatPreference?: string
  assignedSeat?: string
  status: 'waiting' | 'boarding' | 'boarded'
  vehicleId: string
  queuePosition?: number
  boardingTime?: Date
}

export interface NewPassengerData {
  name: string
  type: 'vip' | 'elderly' | 'regular' | 'standby'
  seatPreference?: string
}

export interface SeatAssignment {
  seatId: string
  passengerId: string
  passengerName: string
}

// Fallback composable for local development without database
export const useBoardingQueue = (vehicleId: string) => {
  const passengers = ref<Passenger[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const seatAssignments = ref<SeatAssignment[]>([])
  
  // Generate available seats (customize based on vehicle)
  const totalSeats = ref<string[]>([
    '1A', '1B', '1C', '1D',
    '2A', '2B', '2C', '2D',
    '3A', '3B', '3C', '3D',
    '4A', '4B', '4C', '4D',
    '5A', '5B', '5C', '5D',
    '6A', '6B', '6C', '6D',
    '7A', '7B', '7C', '7D',
    '8A', '8B', '8C', '8D'
  ])

  const availableSeats = computed(() => {
    const assignedSeatIds = seatAssignments.value.map(assignment => assignment.seatId)
    return totalSeats.value.filter(seat => !assignedSeatIds.includes(seat))
  })

  const queueSize = computed(() => passengers.value.filter(p => p.status === 'waiting').length)

  const nextPassenger = computed(() => {
    const waitingPassengers = passengers.value
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        // Priority order: vip (1), elderly (2), regular (3), standby (4)
        const priorityOrder = { vip: 1, elderly: 2, regular: 3, standby: 4 }
        const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type]
        
        if (priorityDiff !== 0) return priorityDiff
        
        // If same priority, sort by arrival time
        return a.arrivalTime.getTime() - b.arrivalTime.getTime()
      })
    
    return waitingPassengers[0] || null
  })

  const passengersByType = computed(() => {
    const groups = {
      vip: passengers.value.filter(p => p.type === 'vip'),
      elderly: passengers.value.filter(p => p.type === 'elderly'),
      regular: passengers.value.filter(p => p.type === 'regular'),
      standby: passengers.value.filter(p => p.type === 'standby')
    }
    return groups
  })

  // Update seat assignments based on current passengers
  const updateSeatAssignments = () => {
    seatAssignments.value = passengers.value
      .filter(p => p.assignedSeat)
      .map(p => ({
        seatId: p.assignedSeat!,
        passengerId: p.id,
        passengerName: p.name
      }))
  }

  const addPassenger = async (passengerData: NewPassengerData): Promise<Passenger | null> => {
    try {
      isLoading.value = true
      error.value = null

      // Validate input
      if (!passengerData.name.trim()) {
        throw new Error('Passenger name is required')
      }

      if (!['vip', 'elderly', 'regular', 'standby'].includes(passengerData.type)) {
        throw new Error('Invalid passenger type')
      }

      // Check if seat preference is available
      if (passengerData.seatPreference && !availableSeats.value.includes(passengerData.seatPreference)) {
        throw new Error('Selected seat is not available')
      }

      const newPassenger: Passenger = {
        id: `passenger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: passengerData.name.trim(),
        type: passengerData.type,
        arrivalTime: new Date(),
        seatPreference: passengerData.seatPreference,
        status: 'waiting',
        vehicleId,
        queuePosition: passengers.value.filter(p => p.status === 'waiting').length + 1
      }

      passengers.value.push(newPassenger)
      
      // If passenger has seat preference and it's available, assign it
      if (passengerData.seatPreference && availableSeats.value.includes(passengerData.seatPreference)) {
        newPassenger.assignedSeat = passengerData.seatPreference
        updateSeatAssignments()
      }

      return newPassenger
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add passenger'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const boardNextPassenger = async (): Promise<Passenger | null> => {
    try {
      isLoading.value = true
      error.value = null

      const passenger = nextPassenger.value
      if (!passenger) {
        throw new Error('No passengers in queue')
      }

      // If passenger doesn't have an assigned seat, assign one
      if (!passenger.assignedSeat) {
        const availableSeat = availableSeats.value[0]
        if (!availableSeat) {
          throw new Error('No available seats')
        }
        
        passenger.assignedSeat = availableSeat
      }

      // Update passenger status
      passenger.status = 'boarded'
      passenger.boardingTime = new Date()
      
      updateSeatAssignments()
      
      return passenger
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to board passenger'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const removePassenger = async (passengerId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const passengerIndex = passengers.value.findIndex(p => p.id === passengerId)
      if (passengerIndex === -1) {
        throw new Error('Passenger not found')
      }

      // Remove passenger from queue
      passengers.value.splice(passengerIndex, 1)
      updateSeatAssignments()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove passenger'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const resetQueue = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Clear local state
      passengers.value = []
      seatAssignments.value = []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reset queue'
    } finally {
      isLoading.value = false
    }
  }

  const loadPassengers = async () => {
    // Fallback version, don't  load from database
    // Passengers are managed in local state
  }

  return {
    // State
    passengers: readonly(passengers),
    isLoading: readonly(isLoading),
    error: readonly(error),
    seatAssignments: readonly(seatAssignments),
    
    // Computed
    queueSize,
    nextPassenger,
    passengersByType,
    availableSeats,
    
    // Methods
    addPassenger,
    boardNextPassenger,
    removePassenger,
    clearError,
    resetQueue,
    loadPassengers
  }
}
