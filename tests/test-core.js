/**
 * FillFaker Core Unit Tests
 * Standalone test runner — no npm dependencies, mocks browser APIs.
 * Run: node tests/test-core.js
 */

// ============================================================
// Minimal browser API mocks
// ============================================================
const CSS = { escape: (s) => s.replace(/([^\w-])/g, '\\$1') };
global.CSS = CSS;

global.window = {
  getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' })
};

global.document = {};

global.chrome = {
  storage: { local: { get: (_, cb) => cb && cb({}), set: (_, cb) => cb && cb() } },
  runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} } }
};

// ============================================================
// Load source files by evaluating them (they assign to window)
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.resolve(__dirname, '..');

function loadScript(relPath) {
  const code = fs.readFileSync(path.join(BASE, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('data/locale-en.js');
loadScript('content-scripts/generator.js');
loadScript('content-scripts/field-detector.js');

const FILLFAKER_DATA = window.FILLFAKER_DATA;
const FakeDataGenerator = window.FakeDataGenerator;
const FieldDetector = window.FieldDetector;

// ============================================================
// Simple test runner
// ============================================================
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL: ${name}`);
  }
}

function assertEq(actual, expected, name) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL: ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function section(title) {
  console.log(`\n--- ${title} ---`);
}

// ============================================================
// Helper: make a mock DOM element for FieldDetector tests
// ============================================================
function mockElement(opts = {}) {
  const el = {
    type: opts.type || '',
    name: opts.name || '',
    id: opts.id || '',
    className: opts.className || '',
    placeholder: opts.placeholder || '',
    tagName: opts.tagName || 'INPUT',
    disabled: false,
    readOnly: false,
    offsetWidth: 100,
    offsetHeight: 30,
    getAttribute(attr) {
      if (attr === 'autocomplete') return opts.autocomplete || null;
      if (attr === 'aria-label') return opts.ariaLabel || null;
      if (attr === 'contenteditable') return null;
      return null;
    },
    getRootNode() {
      return {
        querySelector() { return null; }
      };
    },
    closest() { return null; }
  };
  return el;
}

// ============================================================
// Luhn validator
// ============================================================
function luhnCheck(num) {
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ============================================================
// DATA POOL TESTS
// ============================================================
section('Data Pool');

assert(FILLFAKER_DATA.firstNames.male.length === 250,
  `firstNames.male has 250 entries (got ${FILLFAKER_DATA.firstNames.male.length})`);

assert(FILLFAKER_DATA.firstNames.female.length === 250,
  `firstNames.female has 250 entries (got ${FILLFAKER_DATA.firstNames.female.length})`);

assert(FILLFAKER_DATA.lastNames.length === 200,
  `lastNames has 200 entries (got ${FILLFAKER_DATA.lastNames.length})`);

assert(FILLFAKER_DATA.cities.length === 30,
  `cities has 30 entries (got ${FILLFAKER_DATA.cities.length})`);

for (const c of FILLFAKER_DATA.cities) {
  assert(c.city && c.state && c.stateAbbr && c.zip,
    `city "${c.city}" has all fields`);
  assert(/^\d{3}$/.test(c.zip),
    `city "${c.city}" zip prefix "${c.zip}" is exactly 3 digits`);
}

assert(FILLFAKER_DATA.emailDomains.length === 15,
  `emailDomains has 15 entries (got ${FILLFAKER_DATA.emailDomains.length})`);

assert(FILLFAKER_DATA.streets.length === 70,
  `streets has 70 entries (got ${FILLFAKER_DATA.streets.length})`);

assert(FILLFAKER_DATA.lorem.length === 30,
  `lorem has 30 entries (got ${FILLFAKER_DATA.lorem.length})`);

assert(FILLFAKER_DATA.companies.length === 20,
  `companies has 20 entries (got ${FILLFAKER_DATA.companies.length})`);

assert(FILLFAKER_DATA.jobTitles.length === 20,
  `jobTitles has 20 entries (got ${FILLFAKER_DATA.jobTitles.length})`);

// ============================================================
// GENERATOR TESTS
// ============================================================
section('Generator — generateIdentity()');

const gen = new FakeDataGenerator();
const id = gen.generateIdentity();

const requiredFields = [
  'firstName', 'lastName', 'fullName', 'email', 'phone', 'address',
  'city', 'state', 'stateFull', 'zip', 'country', 'company', 'jobTitle',
  'website', 'username', 'password', 'age', 'birthDate', 'birthDateUS',
  'creditCard', 'creditCardRaw', 'cvv', 'expMonth', 'expYear', 'expDate',
  'ssn', 'bio', 'gender'
];

for (const f of requiredFields) {
  assert(id[f] !== undefined && id[f] !== null, `identity has field "${f}"`);
  assert(typeof id[f] === 'string' && id[f].length > 0, `"${f}" is non-empty string`);
}

// Consistency checks
section('Generator — Consistency');

assert(id.fullName === `${id.firstName} ${id.lastName}`,
  'fullName = firstName + lastName');

const expectedEmailLocal = `${id.firstName.toLowerCase()}.${id.lastName.toLowerCase()}`;
assert(id.email.startsWith(expectedEmailLocal + '@'),
  `email starts with firstName.lastName (${id.email})`);

assert(id.username.startsWith(id.firstName.toLowerCase() + '_'),
  `username starts with firstName lowercase (${id.username})`);

// City/state/zip consistency
const matchingCity = FILLFAKER_DATA.cities.find(c => c.city === id.city);
assert(matchingCity !== undefined, `city "${id.city}" exists in data pool`);
assert(id.state === matchingCity.stateAbbr,
  `state "${id.state}" matches city's stateAbbr "${matchingCity.stateAbbr}"`);
assert(id.zip.startsWith(matchingCity.zip),
  `zip "${id.zip}" starts with city's prefix "${matchingCity.zip}"`);

// Credit card Luhn
section('Generator — Credit Card');

assert(luhnCheck(id.creditCardRaw),
  `creditCardRaw "${id.creditCardRaw}" passes Luhn validation`);
assert(id.creditCardRaw.length === 16,
  `creditCardRaw is 16 digits (got ${id.creditCardRaw.length})`);

// Run Luhn on 20 generated cards for robustness
for (let i = 0; i < 20; i++) {
  const cc = gen.generateCreditCard();
  assert(luhnCheck(cc), `generated card #${i + 1} passes Luhn`);
}

// Password
section('Generator — Password');

assert(id.password.length === 14, `password is 14 chars (got ${id.password.length})`);
assert(/[a-z]/.test(id.password), 'password has lowercase');
assert(/[A-Z]/.test(id.password), 'password has uppercase');
assert(/[0-9]/.test(id.password), 'password has digit');
assert(/[!@#$%&*]/.test(id.password), 'password has special char');

// SSN
section('Generator — SSN');

const ssnParts = id.ssn.split('-');
assert(ssnParts.length === 3, 'SSN has 3 parts');
const ssnArea = parseInt(ssnParts[0], 10);
assert(ssnArea >= 100 && ssnArea <= 665,
  `SSN area ${ssnArea} is in range 100-665`);

// Age
section('Generator — Age / Birth');

const age = parseInt(id.age, 10);
const currentYear = new Date().getFullYear();
assert(age >= currentYear - 2002 && age <= currentYear - 1970,
  `age ${age} is reasonable (${currentYear - 2002}-${currentYear - 1970})`);

// ZIP
assert(/^\d{5}$/.test(id.zip), `ZIP "${id.zip}" is exactly 5 digits`);

// Phone
section('Generator — Phone');

assert(/^\(\d{3}\) \d{3}-\d{4}$/.test(id.phone),
  `phone "${id.phone}" matches (XXX) XXX-XXXX`);

// regenerate() produces different data
section('Generator — regenerate()');

const id2 = gen.regenerate();
assert(id2 !== null, 'regenerate() returns an identity');
// With 500 names, 200 lastNames, the odds of identical fullName are ~1/100000
// We run regenerate 5 times and check at least one differs
let anyDifferent = false;
for (let i = 0; i < 5; i++) {
  const newId = gen.regenerate();
  if (newId.fullName !== id.fullName || newId.email !== id.email) {
    anyDifferent = true;
    break;
  }
}
assert(anyDifferent, 'regenerate() produces different data from previous identity');

// getValueForType
section('Generator — getValueForType()');

gen.generateIdentity();
const id3 = gen.currentIdentity;

assertEq(gen.getValueForType('firstName'), id3.firstName, 'getValueForType("firstName")');
assertEq(gen.getValueForType('email'), id3.email, 'getValueForType("email")');
assertEq(gen.getValueForType('phone'), id3.phone, 'getValueForType("phone")');
assertEq(gen.getValueForType('address'), id3.address, 'getValueForType("address")');
assertEq(gen.getValueForType('city'), id3.city, 'getValueForType("city")');
assertEq(gen.getValueForType('state'), id3.state, 'getValueForType("state")');
assertEq(gen.getValueForType('zip'), id3.zip, 'getValueForType("zip")');
assertEq(gen.getValueForType('bio'), id3.bio, 'getValueForType("bio")');
assertEq(gen.getValueForType('password'), id3.password, 'getValueForType("password")');
assertEq(gen.getValueForType('creditCard'), id3.creditCard, 'getValueForType("creditCard")');
assertEq(gen.getValueForType('ssn'), id3.ssn, 'getValueForType("ssn")');
assertEq(gen.getValueForType('username'), id3.username, 'getValueForType("username")');
assertEq(gen.getValueForType('unknown'), id3.fullName, 'getValueForType("unknown") returns fullName');
assertEq(gen.getValueForType('totallyFake'), id3.fullName, 'getValueForType(unrecognized) returns fullName fallback');

// ============================================================
// FIELD DETECTOR TESTS
// ============================================================
section('Field Detector — input type signals');

assertEq(FieldDetector.detect(mockElement({ type: 'email' })),
  'email', 'input type="email" -> email');

assertEq(FieldDetector.detect(mockElement({ type: 'tel' })),
  'phone', 'input type="tel" -> phone');

assertEq(FieldDetector.detect(mockElement({ type: 'password' })),
  'password', 'input type="password" -> password');

assertEq(FieldDetector.detect(mockElement({ type: 'date' })),
  'birthDate', 'input type="date" -> birthDate');

section('Field Detector — name attribute');

assertEq(FieldDetector.detect(mockElement({ name: 'firstName' })),
  'firstName', 'name="firstName" -> firstName');

assertEq(FieldDetector.detect(mockElement({ name: 'first-name' })),
  'firstName', 'name="first-name" -> firstName');

assertEq(FieldDetector.detect(mockElement({ name: 'user.email' })),
  'email', 'name="user.email" -> email');

section('Field Detector — autocomplete attribute');

assertEq(FieldDetector.detect(mockElement({ autocomplete: 'given-name' })),
  'firstName', 'autocomplete="given-name" -> firstName');

section('Field Detector — cross-signal priority');

// Cross-signal test: name="username" clearly matches username; id="age" matches age.
// Since name is checked before id, username should win — not age.
assertEq(FieldDetector.detect(mockElement({ name: 'username', id: 'age' })),
  'username', 'name="username" + id="age" -> username (name wins over id)');

// Verify the reverse: if only id has the signal, it's detected there
assertEq(FieldDetector.detect(mockElement({ name: 'field1', id: 'age' })),
  'age', 'name="field1" + id="age" -> age (only id matches)');

// name="billing_address" matches address rule; className="state-input" matches state rule.
// name is checked before class, so address should win.
assertEq(FieldDetector.detect(mockElement({ name: 'billing_address', className: 'state-input' })),
  'address', 'name="billing_address" + class="state-input" -> address (name wins over class)');

section('Field Detector — textarea fallback');

assertEq(FieldDetector.detect(mockElement({ tagName: 'TEXTAREA' })),
  'bio', 'textarea with no attributes -> bio');

// ============================================================
// SUMMARY
// ============================================================
console.log('\n============================');
console.log(`TOTAL: ${passed + failed}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
console.log('============================');
if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}
