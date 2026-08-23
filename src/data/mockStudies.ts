import { StudyInstance } from '../types';

export const MOCK_STUDIES: StudyInstance[] = [
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.8091.2026',
    patientId: 'RSNA-KNEE-8091',
    patientAge: 24,
    patientGender: 'M',
    kneeSide: 'Right',
    clinicalIndication: '24yo male, non-contact decelerating injury playing basketball with audible "pop", immediate hemarthrosis and inability to bear weight.',
    studyDate: '2026-08-14',
    magnetStrength: '3.0T',
    difficulty: 'Complex Multi-trauma',
    clinicalNotes: 'Classic acute pivot-shift injury constellation: Full ACL disruption, posterolateral tibial + lateral femoral condylar bone bruise, and lateral meniscus posterior horn tear.',
    report: {
      clinicalHistory: '24-year-old male presenting with acute right knee injury during basketball game. Sensation of popping with rapid swelling.',
      technique: 'Multiplanar multisequence MRI of the right knee obtained without IV contrast on a 3.0 Tesla magnet. Sagittal PD-FS, Coronal T2-FS, Axial PD-FS, and Coronal T1 sequences evaluated.',
      comparison: 'None available.',
      findings: {
        cruciateLigaments: 'Complete midsubstance disruption of the anterior cruciate ligament (ACL) with non-visualization of intact fibers across the intercondylar notch, accompanied by anterior tibial subluxation. The posterior cruciate ligament (PCL) is intact with secondary buckling contour.',
        collateralLigaments: 'MCL demonstrates mild periligamentous fluid edema consistent with low-grade Grade I sprain. Fibers remain in continuity. The fibular collateral ligament and posterolateral corner structures are intact.',
        menisci: 'The lateral meniscus exhibits a vertical longitudinal tear in the posterior horn extending to the superior articular surface. The medial meniscus maintains normal triangular low signal intensity morphology without tear.',
        articularCartilage: 'Medial, lateral, and patellofemoral articular cartilage surfaces are preserved with normal signal and thickness. No osteophytes.',
        osseousStructures: 'Extensive geographic reticular bone marrow edema in the posterior lateral tibial plateau and the mid-lateral femoral condyle (sulcus terminalis), representing the classic pivot-shift impaction bone contusion pattern. No cortical fracture identified.',
        jointFluidSynovium: 'Moderate-to-large high T2 fluid distension of the suprapatellar pouch and parapatellar recesses with fluid-fluid hematocrit layering consistent with hemarthrosis. No Baker cyst.'
      },
      impression: [
        '1. Acute complete midsubstance tear of the Anterior Cruciate Ligament (ACL) with anterior translation of the tibia.',
        '2. Marked kissing bone marrow contusions involving the posterior lateral tibial plateau and lateral femoral condyle.',
        '3. Vertical tear of the posterior horn of the lateral meniscus.',
        '4. Grade I sprain of the medial collateral ligament (MCL).',
        '5. Moderate-to-large traumatic hemarthrosis.'
      ]
    },
    groundTruth: {
      'ACL': 1,
      'MCL': 1,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 1,
      'Medial OA': 0,
      'Lateral OA': 0,
      'PF OA': 0,
      'Effusion': 1,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 1,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.984,
      'MCL': 0.742,
      'Medial Meniscus': 0.081,
      'Lateral Meniscus': 0.915,
      'Medial OA': 0.024,
      'Lateral OA': 0.019,
      'PF OA': 0.038,
      'Effusion': 0.967,
      'Synovitis': 0.120,
      "Baker's": 0.045,
      'Contusion': 0.978,
      'Fracture': 0.089
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS (TR 2800 / TE 35)',
        thicknessMm: 3.0,
        findings: i === 11 ? 'Midsubstance ACL fiber discontinuity and hyperintense edema' : i === 14 ? 'Kissing bone contusion in lateral femoral condyle and posterior lateral tibia' : i === 7 ? 'Vertical hyperintensity in lateral meniscal posterior horn' : undefined,
        pathologyHighlights: i === 11 ? [
          { abnormality: 'ACL', x: 48, y: 52, radius: 18, severity: 'severe', description: 'Complete disruption of ACL fibers with wavy ligament remnant' }
        ] : i === 14 ? [
          { abnormality: 'Contusion', x: 62, y: 38, radius: 22, severity: 'severe', description: 'Reticular high T2 bone marrow edema in lateral femoral condyle' },
          { abnormality: 'Contusion', x: 58, y: 72, radius: 20, severity: 'severe', description: 'Impacted bone contusion at posterolateral tibial plateau' }
        ] : i === 7 ? [
          { abnormality: 'Lateral Meniscus', x: 68, y: 58, radius: 12, severity: 'moderate', description: 'Vertical linear tear in posterior horn reaching superior surface' }
        ] : undefined
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal T2-FS (TR 3200 / TE 65)',
        thicknessMm: 3.0,
        findings: i === 8 ? 'MCL periligamentous high fluid signal, low-grade sprain' : i === 10 ? 'Posterior tibial bone bruise and joint fluid distension' : undefined,
        pathologyHighlights: i === 8 ? [
          { abnormality: 'MCL', x: 22, y: 54, radius: 14, severity: 'mild', description: 'Periligamentous soft tissue fluid surrounding proximal-to-mid MCL fibers' },
          { abnormality: 'Effusion', x: 50, y: 35, radius: 25, severity: 'moderate', description: 'Traumatic effusion in lateral and medial gutters' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD SPAIR (TR 2600 / TE 28)',
        thicknessMm: 3.5,
        findings: i === 6 ? 'Suprapatellar pouch distended with high T2 effusion' : undefined,
        pathologyHighlights: i === 6 ? [
          { abnormality: 'Effusion', x: 50, y: 30, radius: 26, severity: 'severe', description: 'Large hemarthrosis distending suprapatellar bursa' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.4312.2026',
    patientId: 'RSNA-KNEE-4312',
    patientAge: 68,
    patientGender: 'F',
    kneeSide: 'Left',
    clinicalIndication: '68yo female with progressive medial and patellofemoral knee pain, night aching, joint stiffness, and a tense fullness in the posterior popliteal fossa.',
    studyDate: '2026-08-11',
    magnetStrength: '1.5T',
    difficulty: 'Standard',
    clinicalNotes: 'Classic degenerative osteoarthritis tri-compartmental profile with complex medial meniscal degeneration, large popliteal Baker cyst, and reactive synovitis.',
    report: {
      clinicalHistory: '68-year-old female with worsening chronic left knee pain and posterior fullness.',
      technique: 'Standard MRI protocol of the left knee: Sagittal T1, Sagittal PD-FS, Coronal PD-FS, and Axial T2-FS sequences.',
      comparison: 'Radiographs from 6 months prior showing Kellgren-Lawrence Grade 3 medial OA.',
      findings: {
        cruciateLigaments: 'The ACL is chronically degenerated with mucoid infiltration and mild fiber thinning, without acute tear. PCL is intact.',
        collateralLigaments: 'MCL and LCL are intact without acute disruption. Mild capsular osteophytic spurring elevates the deep MCL.',
        menisci: 'Severe horizontal and complex degenerative fraying and maceration of the medial meniscus body and posterior horn, with extrusion of >3mm beyond the tibial margin. The lateral meniscus shows mild blunting.',
        articularCartilage: 'Advanced medial compartment joint space narrowing with full-thickness cartilage loss across the medial femoral condyle and medial tibial plateau. Patellofemoral joint shows Grade III chondromalacia of the lateral patellar facet and trochlea with subchondral cystic remodeling. Lateral compartment cartilage is relatively preserved with only mild thinning.',
        osseousStructures: 'Subchondral sclerosis and marginal osteophyte formation along the medial joint line and patellofemoral margins. No acute bone marrow edema contusion or fracture.',
        jointFluidSynovium: 'Moderate joint effusion with nodular frond-like synovial hypertrophy/synovitis. Large well-circumscribed fluid collection in the posteromedial popliteal fossa dissecting between the semimembranosus tendon and medial gastrocnemius head, measuring 4.8 x 2.2 cm, representing a Baker cyst.'
      },
      impression: [
        '1. Moderate-to-severe medial compartment osteoarthritis (Medial OA) with bone-on-bone cartilage denudation and osteophytes.',
        '2. Patellofemoral osteoarthritis (PF OA) with Grade III-IV chondral defect.',
        '3. Complex degenerative tear and extrusion of the medial meniscus.',
        '4. Large popliteal Baker cyst with internal septation.',
        '5. Moderate joint effusion with reactive synovial thickening (Synovitis).'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 0,
      'Medial Meniscus': 1,
      'Lateral Meniscus': 0,
      'Medial OA': 1,
      'Lateral OA': 0,
      'PF OA': 1,
      'Effusion': 1,
      'Synovitis': 1,
      "Baker's": 1,
      'Contusion': 0,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.142,
      'MCL': 0.088,
      'Medial Meniscus': 0.963,
      'Lateral Meniscus': 0.187,
      'Medial OA': 0.989,
      'Lateral OA': 0.124,
      'PF OA': 0.941,
      'Effusion': 0.892,
      'Synovitis': 0.875,
      "Baker's": 0.991,
      'Contusion': 0.062,
      'Fracture': 0.015
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0,
        findings: i === 5 ? 'Severe Medial Meniscus maceration and cartilage loss' : i === 17 ? 'Fluid distension of gastrocnemius-semimembranosus bursa' : undefined,
        pathologyHighlights: i === 5 ? [
          { abnormality: 'Medial Meniscus', x: 35, y: 55, radius: 16, severity: 'severe', description: 'Complex horizontal and flap tear with extrusion' },
          { abnormality: 'Medial OA', x: 42, y: 48, radius: 24, severity: 'severe', description: 'Full thickness cartilage ulceration with subchondral sclerosis' }
        ] : i === 17 ? [
          { abnormality: "Baker's", x: 74, y: 68, radius: 25, severity: 'severe', description: 'Popliteal Baker cyst with internal proteinaceous debris' }
        ] : undefined
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal PD-FS',
        thicknessMm: 3.0,
        findings: i === 8 ? 'Marked medial compartment joint space obliteration & osteophytes' : undefined,
        pathologyHighlights: i === 8 ? [
          { abnormality: 'Medial OA', x: 26, y: 50, radius: 22, severity: 'severe', description: 'Medial joint space collapse, osteophytes, and eburnation' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial T2-FS',
        thicknessMm: 3.5,
        findings: i === 11 ? 'Prominent neck of Baker cyst communicating with joint capsule' : i === 5 ? 'Synovial fronds and patellofemoral cartilage erosion' : undefined,
        pathologyHighlights: i === 11 ? [
          { abnormality: "Baker's", x: 68, y: 72, radius: 28, severity: 'severe', description: 'Classic comma-shaped Baker cyst between tendons' },
          { abnormality: 'Synovitis', x: 42, y: 36, radius: 18, severity: 'moderate', description: 'Irregular nodular synovial thickening with enhancement' }
        ] : i === 5 ? [
          { abnormality: 'PF OA', x: 52, y: 28, radius: 18, severity: 'severe', description: 'Severe lateral patellar facet chondrosis and subchondral cyst' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.9920.2026',
    patientId: 'RSNA-KNEE-9920',
    patientAge: 31,
    patientGender: 'M',
    kneeSide: 'Right',
    clinicalIndication: '31yo skier following high-velocity twisting fall with severe lateral knee pain, hemarthrosis, and gross lateral joint laxity.',
    studyDate: '2026-08-08',
    magnetStrength: '3.0T',
    difficulty: 'Complex Multi-trauma',
    clinicalNotes: 'Severe multidirectional knee trauma: Segond avulsion fracture of the anterolateral tibial margin, complete ACL tear, lateral meniscus tear, and lateral bone bruising.',
    report: {
      clinicalHistory: '31-year-old male skier status post acute high-energy twisting fall.',
      technique: 'High-resolution 3.0T MRI right knee: Sagittal PD-FS, Coronal T1, Coronal T2-FS, Axial PD-FS.',
      comparison: 'Emergency room radiographs showed suspicious cortical lateral flake.',
      findings: {
        cruciateLigaments: 'Complete mid-to-proximal rupture of the ACL with empty notch sign and ligament stump retracted. PCL is intact.',
        collateralLigaments: 'Fibular collateral ligament (LCL) shows high-grade strain at the fibular head. MCL is intact without sprain.',
        menisci: 'Lateral meniscus exhibits a complex radial tear at the junction of the body and anterior horn. Medial meniscus is intact.',
        articularCartilage: 'Cartilage surfaces are intact without osteoarthritic wear.',
        osseousStructures: 'Cortical avulsion fracture fragment off the anterolateral proximal tibial rim measuring 4 mm, consistent with a pathognomonic Segond fracture (anterolateral ligament avulsion). Severe subchondral bone marrow edema in the lateral femoral condyle and lateral tibial plateau.',
        jointFluidSynovium: 'Large tense hemarthrosis.'
      },
      impression: [
        '1. Segond fracture (avulsion of lateral tibial rim) pathognomonic for high-grade anterolateral rotational instability.',
        '2. Complete midsubstance tear of the Anterior Cruciate Ligament (ACL).',
        '3. Complex tear of the lateral meniscus body/anterior horn.',
        '4. Severe lateral compartment bone contusion.',
        '5. Large traumatic joint effusion/hemarthrosis.'
      ]
    },
    groundTruth: {
      'ACL': 1,
      'MCL': 0,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 1,
      'Medial OA': 0,
      'Lateral OA': 0,
      'PF OA': 0,
      'Effusion': 1,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 1,
      'Fracture': 1
    },
    baselinePredictions: {
      'ACL': 0.992,
      'MCL': 0.114,
      'Medial Meniscus': 0.076,
      'Lateral Meniscus': 0.932,
      'Medial OA': 0.015,
      'Lateral OA': 0.021,
      'PF OA': 0.019,
      'Effusion': 0.975,
      'Synovitis': 0.088,
      "Baker's": 0.031,
      'Contusion': 0.986,
      'Fracture': 0.961
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0,
        findings: i === 10 ? 'Complete ACL rupture with retracted proximal stump' : undefined,
        pathologyHighlights: i === 10 ? [
          { abnormality: 'ACL', x: 46, y: 50, radius: 18, severity: 'severe', description: 'Disrupted ACL fibers and anterior tibial translation' }
        ] : undefined
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal T1 / T2-FS',
        thicknessMm: 3.0,
        findings: i === 6 ? 'Segond avulsion fracture at lateral tibial plateau edge' : undefined,
        pathologyHighlights: i === 6 ? [
          { abnormality: 'Fracture', x: 76, y: 56, radius: 14, severity: 'severe', description: 'Avulsed bony fragment off lateral tibial margin (Segond fracture)' },
          { abnormality: 'Contusion', x: 70, y: 64, radius: 20, severity: 'severe', description: 'Marked trabecular marrow edema surrounding fracture bed' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD-FS',
        thicknessMm: 3.5,
        findings: i === 7 ? 'Effusion with fluid-fluid level' : undefined,
        pathologyHighlights: i === 7 ? [
          { abnormality: 'Effusion', x: 50, y: 32, radius: 24, severity: 'severe', description: 'Large hemarthrosis distending capsule' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.2104.2026',
    patientId: 'RSNA-KNEE-2104',
    patientAge: 52,
    patientGender: 'F',
    kneeSide: 'Right',
    clinicalIndication: '52yo female with sudden sharp posterior-medial knee pain while stepping off a curb, unable to deep squat, recurrent effusion.',
    studyDate: '2026-08-05',
    magnetStrength: '3.0T',
    difficulty: 'Subtle',
    clinicalNotes: 'Subtle medial meniscus posterior root tear (radial complete root disruption within 9mm of tibial insertion) with meniscal extrusion and early medial chondromalacia.',
    report: {
      clinicalHistory: '52-year-old female presenting with acute mechanical medial joint pain.',
      technique: 'High-resolution multiplanar 3.0T MRI right knee.',
      comparison: 'None.',
      findings: {
        cruciateLigaments: 'ACL and PCL are structurally intact without tear.',
        collateralLigaments: 'MCL and LCL intact without sprain or avulsion.',
        menisci: 'Radial complete tear of the medial meniscus posterior horn root attachment with "ghost sign" on sagittal series and truncation on coronal series. Associated medial meniscal extrusion of 3.5 mm. Lateral meniscus is normal.',
        articularCartilage: 'Mild-to-moderate focal cartilage thinning along the weight-bearing medial femoral condyle (early Medial OA). Patellofemoral and lateral cartilage preserved.',
        osseousStructures: 'Mild subchondral reactive bone edema beneath the medial tibial plateau root anchor. No fracture.',
        jointFluidSynovium: 'Mild-to-moderate joint effusion. No Baker cyst.'
      },
      impression: [
        '1. Complete radial tear of the medial meniscus posterior horn root attachment with 3.5 mm extrusion.',
        '2. Early medial compartment osteoarthritis (Medial OA) with focal chondral loss.',
        '3. Mild-to-moderate joint effusion.',
        '4. Cruciate and collateral ligaments intact.'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 0,
      'Medial Meniscus': 1,
      'Lateral Meniscus': 0,
      'Medial OA': 1,
      'Lateral OA': 0,
      'PF OA': 0,
      'Effusion': 1,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 1,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.045,
      'MCL': 0.062,
      'Medial Meniscus': 0.958,
      'Lateral Meniscus': 0.051,
      'Medial OA': 0.812,
      'Lateral OA': 0.032,
      'PF OA': 0.068,
      'Effusion': 0.845,
      'Synovitis': 0.180,
      "Baker's": 0.071,
      'Contusion': 0.764,
      'Fracture': 0.022
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0,
        findings: i === 4 ? 'Ghost sign (non-visualization of posterior root triangle)' : undefined,
        pathologyHighlights: i === 4 ? [
          { abnormality: 'Medial Meniscus', x: 38, y: 62, radius: 14, severity: 'severe', description: 'Complete fluid cleft at posterior root insertion (ghost sign)' }
        ] : undefined
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal PD-FS',
        thicknessMm: 3.0,
        findings: i === 7 ? 'Medial meniscal body extrusion >3mm and early joint space narrowing' : undefined,
        pathologyHighlights: i === 7 ? [
          { abnormality: 'Medial Meniscus', x: 20, y: 52, radius: 15, severity: 'severe', description: 'Meniscal extrusion past tibial edge' },
          { abnormality: 'Medial OA', x: 28, y: 48, radius: 18, severity: 'mild', description: 'Superficial chondral fissure medial condyle' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD-FS',
        thicknessMm: 3.5,
        findings: i === 6 ? 'Radial fluid cleft through posterior root anchor' : undefined,
        pathologyHighlights: i === 6 ? [
          { abnormality: 'Medial Meniscus', x: 42, y: 68, radius: 12, severity: 'severe', description: 'Radial orientation defect through root insertion' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.5518.2026',
    patientId: 'RSNA-KNEE-5518',
    patientAge: 19,
    patientGender: 'M',
    kneeSide: 'Left',
    clinicalIndication: '19yo soccer midfielder with direct valgus blow to the lateral knee, localized medial joint tenderness, no clicking or locking.',
    studyDate: '2026-08-01',
    magnetStrength: '3.0T',
    difficulty: 'Standard',
    clinicalNotes: 'Isolated Grade II MCL sprain with extensive subcutaneous and periligamentous fluid edema, without meniscal or cruciate disruption.',
    report: {
      clinicalHistory: '19-year-old male with direct contact valgus trauma during soccer match.',
      technique: 'Multiplanar MRI of left knee.',
      comparison: 'None.',
      findings: {
        cruciateLigaments: 'ACL and PCL are completely intact with normal uniform low signal.',
        collateralLigaments: 'MCL demonstrates high-grade partial (Grade II) sprain with extensive periligamentous edema and partial fiber disruption along the femoral insertion and proximal third. Deep meniscofemoral and meniscotibial ligaments are edematous but in continuity. LCL is intact.',
        menisci: 'Medial and lateral menisci have normal morphology and homogeneous low signal throughout. No tear.',
        articularCartilage: 'Cartilage surfaces are completely preserved and normal for age.',
        osseousStructures: 'No bone contusion or fracture.',
        jointFluidSynovium: 'Mild physiologic/reactive joint effusion. No Baker cyst or synovitis.'
      },
      impression: [
        '1. Grade II sprain of the superficial and deep medial collateral ligament (MCL) with extensive surrounding edema.',
        '2. Intact cruciate ligaments and menisci.',
        '3. Mild reactive joint effusion.'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 1,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 0,
      'Medial OA': 0,
      'Lateral OA': 0,
      'PF OA': 0,
      'Effusion': 1,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 0,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.038,
      'MCL': 0.974,
      'Medial Meniscus': 0.041,
      'Lateral Meniscus': 0.029,
      'Medial OA': 0.008,
      'Lateral OA': 0.011,
      'PF OA': 0.015,
      'Effusion': 0.812,
      'Synovitis': 0.044,
      "Baker's": 0.012,
      'Contusion': 0.089,
      'Fracture': 0.011
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal T2-FS',
        thicknessMm: 3.0,
        findings: i === 9 ? 'Marked periligamentous high T2 signal around proximal MCL' : undefined,
        pathologyHighlights: i === 9 ? [
          { abnormality: 'MCL', x: 18, y: 52, radius: 20, severity: 'moderate', description: 'Grade II partial disruption of superficial MCL with extensive fascial edema' },
          { abnormality: 'Effusion', x: 50, y: 38, radius: 18, severity: 'mild', description: 'Mild reactive fluid in medial gutter' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD-FS',
        thicknessMm: 3.5,
        findings: i === 8 ? 'Edema tracking along medial retinaculum and sartorial fascia' : undefined,
        pathologyHighlights: i === 8 ? [
          { abnormality: 'MCL', x: 26, y: 55, radius: 18, severity: 'moderate', description: 'Periligamentous soft tissue fluid wrapping medial compartment' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.7734.2026',
    patientId: 'RSNA-KNEE-7734',
    patientAge: 45,
    patientGender: 'F',
    kneeSide: 'Right',
    clinicalIndication: '45yo marathon runner with debilitating anterior knee pain when descending hills and stairs, audible retropatellar crepitus, and swelling.',
    studyDate: '2026-07-28',
    magnetStrength: '3.0T',
    difficulty: 'Standard',
    clinicalNotes: 'Severe isolated Patellofemoral Osteoarthritis (PF OA) with full-thickness patellar median ridge cartilage delamination, trochlear dysplastic spurring, and large joint effusion.',
    report: {
      clinicalHistory: '45-year-old female with severe anterior knee pain and crepitus.',
      technique: 'Multiplanar 3.0T MRI right knee.',
      comparison: 'None.',
      findings: {
        cruciateLigaments: 'Cruciate ligaments intact.',
        collateralLigaments: 'Collaterals intact.',
        menisci: 'Normal morphology and signal in medial and lateral menisci.',
        articularCartilage: 'Full-thickness chondral loss involving the lateral patellar facet and median ridge with underlying subchondral cystic remodeling and reactive edema (PF OA). Medial and lateral femorotibial compartments have intact cartilage.',
        osseousStructures: 'Prominent superior and lateral patellar enthesophytes. No cortical fracture.',
        jointFluidSynovium: 'Moderate-to-large joint effusion with mild synovial thickening.'
      },
      impression: [
        '1. Severe Patellofemoral Osteoarthritis (PF OA) with full-thickness chondral loss on the patellar facet and trochlear groove.',
        '2. Moderate-to-large joint effusion.',
        '3. Femorotibial compartments and menisci intact.'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 0,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 0,
      'Medial OA': 0,
      'Lateral OA': 0,
      'PF OA': 1,
      'Effusion': 1,
      'Synovitis': 1,
      "Baker's": 0,
      'Contusion': 0,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.021,
      'MCL': 0.034,
      'Medial Meniscus': 0.062,
      'Lateral Meniscus': 0.045,
      'Medial OA': 0.088,
      'Lateral OA': 0.041,
      'PF OA': 0.981,
      'Effusion': 0.923,
      'Synovitis': 0.785,
      "Baker's": 0.052,
      'Contusion': 0.071,
      'Fracture': 0.014
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0,
        findings: i === 12 ? 'Severe patellar articular cartilage loss and subchondral cyst' : undefined,
        pathologyHighlights: i === 12 ? [
          { abnormality: 'PF OA', x: 55, y: 22, radius: 18, severity: 'severe', description: 'Full-thickness patellar cartilage loss with eburnation' },
          { abnormality: 'Effusion', x: 52, y: 38, radius: 24, severity: 'moderate', description: 'Effusion filling suprapatellar bursa' }
        ] : undefined
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal T2-FS',
        thicknessMm: 3.0
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD-FS',
        thicknessMm: 3.5,
        findings: i === 5 ? 'Severe lateral facet cartilage delamination and trochlear groove defect' : undefined,
        pathologyHighlights: i === 5 ? [
          { abnormality: 'PF OA', x: 50, y: 30, radius: 20, severity: 'severe', description: 'Cartilage fissuring down to subchondral bone plate' },
          { abnormality: 'Synovitis', x: 38, y: 35, radius: 14, severity: 'mild', description: 'Synovial fringe hyperintensity in lateral gutter' }
        ] : undefined
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.3341.2026',
    patientId: 'RSNA-KNEE-3341',
    patientAge: 61,
    patientGender: 'M',
    kneeSide: 'Left',
    clinicalIndication: '61yo male with valgus deformity, progressive lateral joint line pain on prolonged standing, and lateral meniscus history.',
    studyDate: '2026-07-20',
    magnetStrength: '1.5T',
    difficulty: 'Standard',
    clinicalNotes: 'Isolated Lateral Compartment Osteoarthritis (Lateral OA) with severe lateral cartilage thinning, lateral osteophytes, and lateral meniscus horizontal cleavage tear.',
    report: {
      clinicalHistory: '61-year-old male with lateral knee pain and valgus alignment.',
      technique: 'MRI left knee 1.5T.',
      comparison: 'Prior plain films.',
      findings: {
        cruciateLigaments: 'Cruciate ligaments intact.',
        collateralLigaments: 'LCL and MCL intact.',
        menisci: 'Lateral meniscus exhibits extensive horizontal cleavage tear throughout the body and anterior horn with mild extrusion. Medial meniscus intact.',
        articularCartilage: 'Marked lateral compartment joint space narrowing with full-thickness cartilage denudation across the lateral tibial plateau and lateral femoral condyle (Lateral OA). Medial compartment and patellofemoral cartilage maintained.',
        osseousStructures: 'Lateral marginal tibial and femoral osteophytosis with subchondral sclerosis. No acute fracture.',
        jointFluidSynovium: 'Mild joint effusion.'
      },
      impression: [
        '1. Severe Lateral Compartment Osteoarthritis (Lateral OA).',
        '2. Horizontal cleavage tear and degeneration of the lateral meniscus.',
        '3. Mild joint effusion.'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 0,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 1,
      'Medial OA': 0,
      'Lateral OA': 1,
      'PF OA': 0,
      'Effusion': 1,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 0,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.031,
      'MCL': 0.054,
      'Medial Meniscus': 0.078,
      'Lateral Meniscus': 0.942,
      'Medial OA': 0.092,
      'Lateral OA': 0.978,
      'PF OA': 0.074,
      'Effusion': 0.795,
      'Synovitis': 0.112,
      "Baker's": 0.041,
      'Contusion': 0.061,
      'Fracture': 0.012
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal PD-FS',
        thicknessMm: 3.0,
        findings: i === 10 ? 'Lateral joint space loss, osteophytes, and lateral meniscus tear' : undefined,
        pathologyHighlights: i === 10 ? [
          { abnormality: 'Lateral OA', x: 74, y: 50, radius: 22, severity: 'severe', description: 'Lateral compartment bone-on-bone contact and osteophytes' },
          { abnormality: 'Lateral Meniscus', x: 78, y: 54, radius: 14, severity: 'severe', description: 'Horizontal cleavage tear through lateral meniscus' }
        ] : undefined
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial T2-FS',
        thicknessMm: 3.5
      }))
    }
  },
  {
    studyInstanceUID: '1.2.826.0.1.3680043.8.498.1002.2026',
    patientId: 'RSNA-KNEE-1002',
    patientAge: 22,
    patientGender: 'M',
    kneeSide: 'Right',
    clinicalIndication: '22yo collegiate sprinter with transient right knee soreness after training, rule out internal derangement.',
    studyDate: '2026-07-15',
    magnetStrength: '3.0T',
    difficulty: 'Normal',
    clinicalNotes: 'Unremarkable normal knee MRI: Pristine cruciate ligaments, intact menisci, pristine cartilage across all three compartments, no effusion.',
    report: {
      clinicalHistory: '22-year-old male athlete with transient non-specific knee soreness.',
      technique: 'High-field 3.0T MRI right knee without contrast.',
      comparison: 'None.',
      findings: {
        cruciateLigaments: 'ACL and PCL are completely intact with sharp borders and continuous low signal intensity.',
        collateralLigaments: 'MCL, LCL, and posterolateral corner structures are pristine.',
        menisci: 'Medial and lateral menisci have sharp triangular margins with homogeneous low signal. No tear or degeneration.',
        articularCartilage: 'Normal cartilage thickness and signal throughout medial, lateral, and patellofemoral compartments. No osteophytes.',
        osseousStructures: 'Normal marrow signal. No edema, contusion, or fracture.',
        jointFluidSynovium: 'Physiologic minimal fluid. No joint effusion, synovitis, or Baker cyst.'
      },
      impression: [
        '1. Completely normal MRI examination of the right knee without internal derangement.',
        '2. No ligamentous, meniscal, chondral, or osseous abnormalities.'
      ]
    },
    groundTruth: {
      'ACL': 0,
      'MCL': 0,
      'Medial Meniscus': 0,
      'Lateral Meniscus': 0,
      'Medial OA': 0,
      'Lateral OA': 0,
      'PF OA': 0,
      'Effusion': 0,
      'Synovitis': 0,
      "Baker's": 0,
      'Contusion': 0,
      'Fracture': 0
    },
    baselinePredictions: {
      'ACL': 0.012,
      'MCL': 0.018,
      'Medial Meniscus': 0.025,
      'Lateral Meniscus': 0.021,
      'Medial OA': 0.014,
      'Lateral OA': 0.009,
      'PF OA': 0.016,
      'Effusion': 0.042,
      'Synovitis': 0.018,
      "Baker's": 0.011,
      'Contusion': 0.015,
      'Fracture': 0.005
    },
    slices: {
      sagittal: Array.from({ length: 20 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 20,
        plane: 'Sagittal',
        sequenceName: 'Sagittal PD-FS',
        thicknessMm: 3.0
      })),
      coronal: Array.from({ length: 18 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 18,
        plane: 'Coronal',
        sequenceName: 'Coronal T2-FS',
        thicknessMm: 3.0
      })),
      axial: Array.from({ length: 16 }, (_, i) => ({
        sliceIndex: i + 1,
        totalSlices: 16,
        plane: 'Axial',
        sequenceName: 'Axial PD-FS',
        thicknessMm: 3.5
      }))
    }
  }
];
