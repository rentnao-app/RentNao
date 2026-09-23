/**
 * Module 3: Bangla Profile Service (Orchestrator)
 *
 * Takes raw English profile data, routes fields to the appropriate
 * transliteration module, and returns a unified BanglaProfileData object.
 *
 * Persistence is handled here — after generating the _bn fields,
 * the orchestrator writes them to the database via a single UPDATE query.
 *
 * This module is entirely decoupled from HTTP controllers.
 * It can be called from scheduled jobs, CLI scripts, or migration tools.
 */

import { db } from '@/db/client';
import { toBengaliDigits } from './numeric-mapper';
import { transliterateBatch } from './phonetic-engine';
import type {
  EnglishProfileData,
  BanglaProfileData,
  TransliterationTarget,
} from './types';

/**
 * Generate Bengali equivalents for all transliterable fields.
 *
 * Pure computation — no I/O. The caller decides whether to persist.
 */
export function generateBanglaProfile(data: EnglishProfileData): BanglaProfileData {
  // ── Module 1: Numeric fields ──
  const nid_bn = data.nid ? toBengaliDigits(data.nid) : null;
  const phone_bn = data.phone ? toBengaliDigits(data.phone) : null;
  const floor_no_bn = data.floorNo != null
    ? toBengaliDigits(String(data.floorNo))
    : null;
  const flat_no_bn = data.flatNo ? toBengaliDigits(data.flatNo) : null;

  // ── Module 2: Phonetic text fields ──
  const textInputs = [
    data.fullName,
    data.fatherName,
    data.motherName,
    data.propertyAddress,
    data.profession,
    data.religion,
  ];

  const [
    full_name_bn,
    father_name_bn,
    mother_name_bn,
    property_address_bn,
    profession_bn,
    religion_bn,
  ] = transliterateBatch(textInputs);

  return {
    nid_bn,
    phone_bn,
    floor_no_bn,
    flat_no_bn,
    full_name_bn: full_name_bn ?? null,
    father_name_bn: father_name_bn ?? null,
    mother_name_bn: mother_name_bn ?? null,
    property_address_bn: property_address_bn ?? null,
    profession_bn: profession_bn ?? null,
    religion_bn: religion_bn ?? null,
  };
}

/**
 * Persist transliterated data to the database.
 *
 * Builds a dynamic UPDATE query from non-null _bn fields.
 * Only columns that have values are touched — existing _bn data
 * for fields not in the current input is preserved.
 */
export async function persistBanglaProfile(
  bangla: BanglaProfileData,
  target: TransliterationTarget,
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const addIfPresent = (column: string, value: string | null) => {
    if (value !== null) {
      updates.push(`${column} = $${idx++}`);
      values.push(value);
    }
  };

  // Map BanglaProfileData keys to DB column names
  addIfPresent('full_name_bn', bangla.full_name_bn);
  addIfPresent('father_name_bn', bangla.father_name_bn);
  addIfPresent('mother_name_bn', bangla.mother_name_bn);
  addIfPresent('property_address_bn', bangla.property_address_bn);
  addIfPresent('profession_bn', bangla.profession_bn);
  addIfPresent('religion_bn', bangla.religion_bn);
  addIfPresent('nid_bn', bangla.nid_bn);
  addIfPresent('phone_bn', bangla.phone_bn);
  addIfPresent('floor_no_bn', bangla.floor_no_bn);
  addIfPresent('flat_no_bn', bangla.flat_no_bn);

  if (updates.length === 0) {
    return; // Nothing to write
  }

  values.push(target.idValue);
  const whereClause = `${target.idColumn} = $${idx}`;

  await db.query(
    `UPDATE "${target.table}" SET ${updates.join(', ')} WHERE ${whereClause}`,
    values,
  );
}
