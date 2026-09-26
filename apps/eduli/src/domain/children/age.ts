export const EDULI_AGE_ERROR =
  'Eduli jest obecnie przeznaczone dla dzieci w wieku 4-8 lat.';

export function parseBirthDate(birthDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;

  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(year, month - 1, day);

  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }

  return birth;
}

export function ageFromBirthDate(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = parseBirthDate(birthDate);
  if (!birth) return null;

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (birth > todayDate) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!birthdayPassed) age -= 1;
  return age;
}

export function isEligibleEduliBirthDate(birthDate: string) {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= 4 && age <= 8;
}
