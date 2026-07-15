export function validateEmail(email) {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return regex.test(email)
}

export function validatePassword(password) {
  return password && password.length >= 6
}

export function validatePlanName(name) {
  return name && name.trim().length > 0 && name.trim().length <= 100
}

export function validatePointText(text) {
  return text && text.trim().length > 0 && text.trim().length <= 200
}

export function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export function calcPercentage(points) {
  if (!points || points.length === 0) return 0
  const done = points.filter((p) => p.done).length
  return Math.round((done / points.length) * 100)
}
