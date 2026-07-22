export async function compressImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 96
        let { width, height } = img
        if (width > height) {
          if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
        } else {
          if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.35)
        resolve(dataUrl)
      }
      img.onerror = () => resolve(null)
      img.src = reader.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
