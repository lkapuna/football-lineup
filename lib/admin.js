export function normalizePhone(phone = "") {
  return String(phone).replace(/[^\d+]/g, "").trim();
}

export function isAdminPhone(phone) {
  const normalized = normalizePhone(phone);
  const admins = (process.env.ADMIN_PHONE_NUMBERS || "")
    .split(",")
    .map((item) => normalizePhone(item))
    .filter(Boolean);
  return admins.includes(normalized);
}
