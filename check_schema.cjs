// Test if the UUID passes validation
const uuid = "00000000-0000-0000-0000-000000000002";
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
console.log("UUID:", uuid);
console.log("Valid UUID?", regex.test(uuid));
console.log("UUID length:", uuid.length);
