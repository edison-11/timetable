<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <div v-if="showAccountMenu" ref="accountMenuRef" class="app-account-menu">
      <button type="button" class="app-account-trigger" @click="toggleAccountMenu">
        <span class="app-account-welcome">Welcome, {{ displayName }}</span>
        <span class="app-account-avatar">
          <img
            v-if="resolvedProfilePhoto && !accountPhotoFailed"
            :src="resolvedProfilePhoto"
            :alt="`${displayName} profile photo`"
            @error="accountPhotoFailed = true"
          >
          <span v-else>{{ initials }}</span>
        </span>
      </button>

      <div v-if="accountMenuOpen" class="app-account-dropdown">
        <div class="app-account-summary">
          <div class="app-account-name">{{ displayName }}</div>
          <div class="app-account-meta">{{ accountMeta }}</div>
        </div>
        <button
          v-if="showDashboardLink"
          type="button"
          class="app-account-action"
          @click="goToDashboard"
        >
          Dashboard
        </button>
        <button type="button" class="app-account-action" @click="openProfileModal">
          Edit Profile
        </button>
        <button type="button" class="app-account-action danger" @click="handleLogout">
          Log out
        </button>
      </div>
    </div>

    <div v-if="profileModalOpen" class="app-profile-backdrop" @click.self="closeProfileModal">
      <form class="app-profile-modal" @submit.prevent="saveProfile">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 class="h4 mb-1">Edit Profile</h2>
            <p class="text-muted mb-0">{{ profileSubtitle }}</p>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="closeProfileModal"></button>
        </div>

        <div v-if="profileMessage" class="alert mb-3" :class="profileMessageType === 'success' ? 'alert-success' : 'alert-danger'">
          {{ profileMessage }}
        </div>

        <div class="app-profile-photo-field mb-4">
          <div class="app-profile-photo-preview">
            <img
              v-if="resolvedProfileFormPhoto && !profilePreviewFailed"
              :src="resolvedProfileFormPhoto"
              alt=""
              @error="profilePreviewFailed = true"
            >
            <span v-else>{{ initials }}</span>
          </div>
          <div class="flex-grow-1">
            <label for="profilePhoto" class="form-label">Profile Photo</label>
            <input
              id="profilePhoto"
              ref="profilePhotoInput"
              type="file"
              class="visually-hidden"
              accept="image/*"
              :disabled="photoUploading || authStore.loading"
              @change="handlePhotoSelected"
            >
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline-primary"
                :disabled="photoUploading || authStore.loading"
                @click="profilePhotoInput?.click()"
              >
                {{ profileForm.profile_photo ? 'Change Photo' : 'Choose Photo' }}
              </button>
              <button
                v-if="profileForm.profile_photo"
                type="button"
                class="btn btn-outline-danger"
                :disabled="photoUploading || authStore.loading"
                @click="removeProfilePhoto"
              >
                Remove
              </button>
            </div>
            <div class="form-text">
              {{ photoUploading ? 'Uploading photo...' : 'JPG, PNG, WEBP or GIF up to 2MB.' }}
            </div>
          </div>
        </div>

        <div v-if="authStore.currentUserType === 'teacher'" class="mb-3">
          <label for="profileName" class="form-label">Name</label>
          <input id="profileName" v-model="profileForm.name" type="text" class="form-control" required>
        </div>

        <div v-else class="mb-3">
          <label for="profileUsername" class="form-label">Username</label>
          <input id="profileUsername" v-model="profileForm.username" type="text" class="form-control" required>
        </div>

        <div class="mb-3">
          <label for="profileEmail" class="form-label">Email</label>
          <input id="profileEmail" v-model="profileForm.email" type="email" class="form-control" required>
        </div>

        <div v-if="authStore.currentUserType === 'teacher'" class="mb-3">
          <label for="profileDepartment" class="form-label">Department</label>
          <select id="profileDepartment" v-model="profileForm.department" class="form-select" required>
            <option v-for="department in departmentOptions" :key="department" :value="department">
              {{ department }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label for="profilePassword" class="form-label">New Password</label>
          <div class="input-group">
            <input
              id="profilePassword"
              v-model="profileForm.password"
              :type="showProfilePassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Leave blank to keep current password"
            >
            <button type="button" class="btn btn-outline-secondary" @click="showProfilePassword = !showProfilePassword">
              {{ showProfilePassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" @click="closeProfileModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary-custom" :disabled="authStore.loading">
            {{ authStore.loading ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="cropModalOpen" class="app-profile-backdrop app-crop-backdrop" @click.self="closeCropModal">
      <div class="app-profile-modal app-crop-modal">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 class="h4 mb-1">Crop Photo</h2>
            <p class="text-muted mb-0">Move and zoom the image to fill the circle.</p>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="closeCropModal"></button>
        </div>

        <div
          class="app-crop-stage"
          @pointerdown="startCropDrag"
          @pointermove="moveCropDrag"
          @pointerup="endCropDrag"
          @pointercancel="endCropDrag"
          @wheel.prevent="handleCropWheel"
        >
          <img
            v-if="cropImageUrl"
            :src="cropImageUrl"
            alt="Crop preview"
            :style="cropImageStyle"
            draggable="false"
          >
          <div class="app-crop-circle"></div>
        </div>

        <label for="cropZoom" class="form-label mt-3">Zoom</label>
        <input
          id="cropZoom"
          v-model.number="cropState.zoom"
          type="range"
          class="form-range"
          min="1"
          max="3"
          step="0.01"
        >

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" @click="closeCropModal">
            Cancel
          </button>
          <button type="button" class="btn btn-primary-custom" :disabled="photoUploading" @click="applyCroppedPhoto">
            {{ photoUploading ? 'Uploading...' : 'Use Photo' }}
          </button>
        </div>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const departmentOptions = ['Business', 'Software Development', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Networking', 'Accounting', 'Finance', 'Marketing', 'Management', 'Hospitality', 'Tourism', 'Construction', 'Mechanical', 'Automotive', 'Agriculture', 'General Studies']
const accountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const profilePhotoInput = ref(null)
const profileModalOpen = ref(false)
const profileMessage = ref('')
const profileMessageType = ref('success')
const photoUploading = ref(false)
const accountPhotoFailed = ref(false)
const profilePreviewFailed = ref(false)
const showProfilePassword = ref(false)
const cropModalOpen = ref(false)
const cropImageUrl = ref('')
const cropImageElement = ref(null)
const cropFileName = ref('profile-photo.png')
const cropState = ref({
  x: 0,
  y: 0,
  zoom: 1,
  dragging: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0
})
const profileForm = ref({
  username: '',
  name: '',
  email: '',
  department: '',
  profile_photo: '',
  password: ''
})

const showAccountMenu = computed(() => {
  return (route.meta.requiresAuth || route.meta.requiresTeacherAuth) && authStore.isAuthenticated
})

const displayName = computed(() => {
  const user = authStore.currentUser || {}
  return user.username || user.name || user.email?.split('@')[0] || 'Admin'
})

const initials = computed(() => {
  return displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'
})

const accountMeta = computed(() => {
  const user = authStore.currentUser || {}
  return user.email || (authStore.currentUserType === 'teacher' ? 'Teacher account' : 'Admin account')
})

const profilePhoto = computed(() => {
  return authStore.currentUser?.profile_photo || ''
})

const resolveUploadUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return ''
  }

  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }

  if (path.startsWith('http')) {
    try {
      const url = new URL(path)

      if (url.pathname.startsWith('/uploads/')) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch (error) {
      return path
    }
  }

  return path
}

const resolvedProfilePhoto = computed(() => resolveUploadUrl(profilePhoto.value))

const resolvedProfileFormPhoto = computed(() => resolveUploadUrl(profileForm.value.profile_photo))

const cropImageStyle = computed(() => {
  return {
    transform: `translate(calc(-50% + ${cropState.value.x}px), calc(-50% + ${cropState.value.y}px)) scale(${cropState.value.zoom})`
  }
})

const profileSubtitle = computed(() => {
  return authStore.currentUserType === 'teacher'
    ? 'Update your teacher account details.'
    : 'Update your admin account details.'
})

const showDashboardLink = computed(() => {
  return authStore.currentUserType !== 'teacher' && route.path !== '/dashboard'
})

const toggleAccountMenu = () => {
  accountMenuOpen.value = !accountMenuOpen.value
}

const closeAccountMenu = () => {
  accountMenuOpen.value = false
}

const goToDashboard = () => {
  closeAccountMenu()
  router.push('/dashboard')
}

const openProfileModal = () => {
  const user = authStore.currentUser || {}

  profileForm.value = {
    username: user.username || '',
    name: user.name || '',
    email: user.email || '',
    department: user.department || '',
    profile_photo: user.profile_photo || '',
    password: ''
  }
  profileMessage.value = ''
  profileMessageType.value = 'success'
  profilePreviewFailed.value = false
  closeAccountMenu()
  profileModalOpen.value = true
}

const closeProfileModal = () => {
  profileModalOpen.value = false
  profileMessage.value = ''
}

const handlePhotoSelected = (event) => {
  const [file] = event.target.files || []
  event.target.value = ''

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    profileMessage.value = 'Please choose an image file.'
    profileMessageType.value = 'danger'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    profileMessage.value = 'Profile photo must be 2MB or smaller.'
    profileMessageType.value = 'danger'
    return
  }

  profileMessage.value = ''
  profilePreviewFailed.value = false
  openCropModal(file)
}

const openCropModal = (file) => {
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
  }

  cropImageUrl.value = URL.createObjectURL(file)
  cropFileName.value = file.name || 'profile-photo.png'
  cropImageElement.value = null
  cropState.value = {
    x: 0,
    y: 0,
    zoom: 1,
    dragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  }

  const image = new Image()
  image.onload = () => {
    cropImageElement.value = image
  }
  image.src = cropImageUrl.value
  cropModalOpen.value = true
}

const closeCropModal = () => {
  cropModalOpen.value = false
  cropState.value.dragging = false

  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
  }

  cropImageUrl.value = ''
  cropImageElement.value = null
}

const startCropDrag = (event) => {
  event.currentTarget.setPointerCapture(event.pointerId)
  cropState.value.dragging = true
  cropState.value.startX = event.clientX
  cropState.value.startY = event.clientY
  cropState.value.startOffsetX = cropState.value.x
  cropState.value.startOffsetY = cropState.value.y
}

const moveCropDrag = (event) => {
  if (!cropState.value.dragging) {
    return
  }

  cropState.value.x = cropState.value.startOffsetX + event.clientX - cropState.value.startX
  cropState.value.y = cropState.value.startOffsetY + event.clientY - cropState.value.startY
}

const endCropDrag = () => {
  cropState.value.dragging = false
}

const handleCropWheel = (event) => {
  const nextZoom = cropState.value.zoom + (event.deltaY > 0 ? -0.08 : 0.08)
  cropState.value.zoom = Math.min(3, Math.max(1, Number(nextZoom.toFixed(2))))
}

const createCroppedPhotoBlob = () => {
  return new Promise((resolve, reject) => {
    const image = cropImageElement.value

    if (!image) {
      reject(new Error('Image is not ready yet.'))
      return
    }

    const outputSize = 512
    const stageSize = 280
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    const baseScale = Math.max(stageSize / image.naturalWidth, stageSize / image.naturalHeight)
    const scale = baseScale * cropState.value.zoom
    const displayedWidth = image.naturalWidth * scale
    const displayedHeight = image.naturalHeight * scale
    const sourcePerStagePixel = outputSize / stageSize
    const drawWidth = displayedWidth * sourcePerStagePixel
    const drawHeight = displayedHeight * sourcePerStagePixel
    const drawX = outputSize / 2 - drawWidth / 2 + cropState.value.x * sourcePerStagePixel
    const drawY = outputSize / 2 - drawHeight / 2 + cropState.value.y * sourcePerStagePixel

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Could not crop photo.'))
      }
    }, 'image/png', 0.92)
  })
}

const applyCroppedPhoto = async () => {
  photoUploading.value = true
  profileMessage.value = ''

  try {
    const blob = await createCroppedPhotoBlob()
    const formData = new FormData()
    formData.append('photo', blob, cropFileName.value.replace(/\.[^.]+$/, '.png'))
    const response = await api.post('/upload/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    profileForm.value.profile_photo = response.data.photo.path || response.data.photo.url
    profilePreviewFailed.value = false
    accountPhotoFailed.value = false
    profileMessage.value = 'Cropped photo uploaded. Save profile to apply it.'
    profileMessageType.value = 'success'
    closeCropModal()
  } catch (error) {
    profileMessage.value = error.response?.data?.message || error.message || 'Failed to upload profile photo.'
    profileMessageType.value = 'danger'
  } finally {
    photoUploading.value = false
  }
}

const removeProfilePhoto = () => {
  profileForm.value.profile_photo = ''
  profilePreviewFailed.value = false
}

const saveProfile = async () => {
  profileMessage.value = 'Saving profile...'
  profileMessageType.value = 'success'

  const payload = authStore.currentUserType === 'teacher'
    ? {
        name: profileForm.value.name,
        email: profileForm.value.email,
        department: profileForm.value.department,
        profile_photo: profileForm.value.profile_photo,
        password: profileForm.value.password
      }
    : {
        username: profileForm.value.username,
        email: profileForm.value.email,
        profile_photo: profileForm.value.profile_photo,
        password: profileForm.value.password
      }

  const result = await authStore.updateProfile(payload)

  if (!result.success) {
    profileMessage.value = result.error
    profileMessageType.value = 'danger'
    return
  }

  profileMessage.value = 'Profile updated successfully.'
  profileMessageType.value = 'success'
  accountPhotoFailed.value = false
  profileForm.value.password = ''
}

const handleLogout = () => {
  const loginRoute = authStore.currentUserType === 'teacher' ? '/teacher/login' : '/login'
  authStore.logout()
  closeAccountMenu()
  router.push(loginRoute)
}

const handleDocumentClick = (event) => {
  if (!accountMenuRef.value?.contains(event.target)) {
    closeAccountMenu()
  }
}

onMounted(() => {
  // Check if user is already logged in
  authStore.checkAuth()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(() => route.fullPath, () => {
  closeAccountMenu()
})
</script>
