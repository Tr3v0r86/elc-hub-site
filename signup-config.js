// Set the ELC-owned form endpoint before publishing.
// Recommended: a Formspree form endpoint, https://formspree.io/f/<form-id>.
// It must accept JSON with first_name, email and both interest booleans,
// store a server receipt time, and return {"ok": true} only after saving.
// Public form IDs belong here; API keys, Google tokens and GitHub tokens never do.
window.HUB_SIGNUP_ENDPOINT = '';
