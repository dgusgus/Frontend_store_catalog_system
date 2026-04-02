export interface CloudinaryUploadResult {
  secure_url:  string   // URL https permanente
  public_id:   string   // ID para borrar/transformar desde backend
  width:       number
  height:      number
  format:      string
  bytes:       number
}

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryUploadError'
  }
}

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {

  // Validaciones antes de subir
  const MAX_MB   = 5
  const MAX_BYTES = MAX_MB * 1024 * 1024
  const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!ALLOWED.includes(file.type)) {
    throw new CloudinaryUploadError(`Formato no soportado. Usa JPG, PNG o WebP`)
  }
  if (file.size > MAX_BYTES) {
    throw new CloudinaryUploadError(`La imagen no puede superar ${MAX_MB}MB`)
  }

  const formData = new FormData()
  formData.append('file',           file)
  formData.append('upload_preset',  UPLOAD_PRESET)
  formData.append('folder',         'store-catalog')

  // XMLHttpRequest para poder trackear progreso
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult)
      } else {
        const err = JSON.parse(xhr.responseText)
        reject(new CloudinaryUploadError(err?.error?.message ?? 'Error al subir imagen'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new CloudinaryUploadError('Sin conexión al subir la imagen'))
    })

    xhr.open('POST', UPLOAD_URL)
    xhr.send(formData)
  })
}

// Genera variantes optimizadas de cualquier URL de Cloudinary
export function cloudinaryUrl(
  url: string,
  options: {
    width?:   number
    height?:  number
    quality?: 'auto' | number
    format?:  'auto' | 'webp' | 'jpg'
    crop?:    'fill' | 'fit' | 'thumb'
  } = {}
): string {
  // Solo transforma URLs de Cloudinary
  if (!url.includes('cloudinary.com')) return url

  const {
    width,
    height,
    quality = 'auto',
    format  = 'auto',
    crop    = 'fill',
  } = options

  const transforms: string[] = [
    `f_${format}`,
    `q_${quality}`,
  ]

  if (width)  transforms.push(`w_${width}`)
  if (height) transforms.push(`h_${height}`)
  if (width || height) transforms.push(`c_${crop}`)

  // Inserta las transformaciones en la URL
  // De: https://res.cloudinary.com/cloud/image/upload/folder/image.jpg
  // A:  https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto,w_400/folder/image.jpg
  return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`)
}