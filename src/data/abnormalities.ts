import { AbnormalityKey, AbnormalityMeta, ViewPlane } from '../types';

export const ABNORMALITIES_META: Record<AbnormalityKey, AbnormalityMeta> = {
  'ACL': {
    key: 'ACL',
    shortName: 'ACL Tear',
    category: 'Ligament',
    description: 'Anterior cruciate ligament disruption (complete or high-grade partial tear), discontinuity of fibers or abnormal high signal.',
    primaryPlane: 'Sagittal',
    keySequence: 'Sagittal PD / T2-FS',
    clinicalSignificance: 'Causes anterior tibial translation instability; frequently requires surgical reconstruction in active patients.',
    color: '#ef4444',
    urgencyTier: 'Urgent Surgical',
    clinicalRecommendations: [
      'Immediate orthopedic sports medicine surgical consultation for ligament reconstruction evaluation in active individuals.',
      'Provide hinged knee brace locked at 0-90° flexion with protected weight-bearing using axillary crutches.',
      'Initiate pre-operative "prehabilitation" physical therapy focusing on swelling reduction and quadriceps neuromuscular activation.'
    ],
    surgicalIndication: 'Indicated for symptomatic instability, pivot-shift positive tests, concomitant repairable meniscus tears, or high-demand athletic goals.',
    conservativeProtocol: 'For low-demand/sedentary patients: structured 12-week closed-chain kinetic physical therapy with functional derotation bracing.',
    imagingFollowUp: 'Post-operative MRI at 6-9 months or if graft impingement/cyclops lesion symptoms arise; repeat MRI if secondary instability occurs.',
    mlModelingRecommendations: [
      'Prioritize Sagittal PD-FS slices 8-14 with multi-slice context attention windows.',
      'Combine vision features with paired report mentions of "anterior translation" or "pivot shift bone bruise" for high-recall gating.'
    ]
  },
  'MCL': {
    key: 'MCL',
    shortName: 'MCL Injury',
    category: 'Ligament',
    description: 'Medial collateral ligament sprain or disruption, periligamentous fluid and fiber thickening/discontinuity.',
    primaryPlane: 'Coronal',
    keySequence: 'Coronal PD-FS / T2',
    clinicalSignificance: 'Valgus knee stability stabilizer; grade I-II usually managed conservatively, grade III may involve capsule.',
    color: '#f97316',
    urgencyTier: 'Conservative Management',
    clinicalRecommendations: [
      'Fit hinged knee orthosis with valgus stop for 4 to 6 weeks to shield medial compartment during early healing.',
      'Progressive weight-bearing as tolerated with protected sagittal knee range of motion exercises (0-90°).',
      'Avoid high-torque valgus stress and open-chain medial rotational torque during acute recovery phase.'
    ],
    surgicalIndication: 'Grade III complete tears with bony avulsion, severe valgus laxity in full extension, or multiligament knee dislocation.',
    conservativeProtocol: 'Grade I-II: RICE protocol, early functional rehabilitation, adductor and quadriceps strengthening from week 3 onwards.',
    imagingFollowUp: 'Repeat ultrasound or targeted coronal MRI at 6 weeks only if gross persistent medial joint line laxity is documented.',
    mlModelingRecommendations: [
      'Coronal T2-FS sequence is the decisive plane; apply coronal slice contrast jitter to prevent overfitting on mild periligamentous edema.',
      'Calibrate probability threshold downwards (0.38) to capture subtle Grade I superficial sprains without fiber discontinuity.'
    ]
  },
  'Medial Meniscus': {
    key: 'Medial Meniscus',
    shortName: 'Medial Meniscus Tear',
    category: 'Meniscus',
    description: 'Linear or complex high intrameniscal signal extending to the superior or inferior articular surface or free margin.',
    primaryPlane: 'Sagittal',
    keySequence: 'Sagittal & Coronal PD-FS',
    clinicalSignificance: 'Shock absorber damage; high risk of mechanical catching, pain, and accelerated cartilage degeneration.',
    color: '#06b6d4',
    urgencyTier: 'Moderate Orthopedic',
    clinicalRecommendations: [
      'Orthopedic evaluation to determine tear morphology (red-red vascular repair candidate vs degenerative cleavage).',
      'Prescribe unloader knee brace if accompanied by early medial compartment contact stress or joint space narrowing.',
      'Activity modification avoiding repetitive deep squats, rotational pivoting, and heavy impact sports.'
    ],
    surgicalIndication: 'Locked knee (bucket-handle tear), root tears requiring transosseous pullout repair, or persistent mechanical symptoms failing 6-8 weeks conservative care.',
    conservativeProtocol: '8-12 weeks physical therapy emphasizing hamstring/quadriceps balance, stationary cycling, and hip abductor strengthening.',
    imagingFollowUp: 'Follow-up MRI in 3-6 months if mechanical locking develops, or weight-bearing Rosenberg radiographs to monitor medial joint space.',
    mlModelingRecommendations: [
      'Integrate Sagittal AND Coronal PD-FS paired views using Cross-Plane Attention to resolve 2-slice rule criteria.',
      'Implement multi-task loss penalizing confusion between myxoid degeneration (grade 2) and true surface-reaching tears (grade 3).'
    ]
  },
  'Lateral Meniscus': {
    key: 'Lateral Meniscus',
    shortName: 'Lateral Meniscus Tear',
    category: 'Meniscus',
    description: 'Intrameniscal signal reaching articular surface in the anterior horn, body, or posterior horn of lateral meniscus.',
    primaryPlane: 'Coronal',
    keySequence: 'Coronal & Sagittal PD-FS',
    clinicalSignificance: 'Often associated with acute pivot-shift ACL injuries; critical to repair when possible to preserve joint biomechanics.',
    color: '#0ea5e9',
    urgencyTier: 'Moderate Orthopedic',
    clinicalRecommendations: [
      'Prompt orthopedic arthroscopic consultation—lateral meniscus carries 70% load of lateral compartment, making preservation essential.',
      'Assess for co-existing ACL or popliteomeniscal fascicle instability.',
      'Temporary protected crutch-assisted ambulation if joint line tenderness and painful hyperextension are present.'
    ],
    surgicalIndication: 'Strong bias toward arthroscopic repair/suture in young patients, root tears, or unstable radial tears at the hiatus.',
    conservativeProtocol: 'Non-operative management strictly reserved for stable partial-thickness tears (<5mm) or asymptomatic degenerative fissures.',
    imagingFollowUp: 'High-resolution coronal 3D PD-FS at 6 months post-repair to verify meniscal signal maturation and absence of extrusion.',
    mlModelingRecommendations: [
      'Focus attention maps on the popliteal hiatus zone on coronal slices 6-12 to avoid false-negative root/posterior horn tears.',
      'Leverage co-occurrence correlation with ACL tears via shared multimodal transformer layers.'
    ]
  },
  'Medial OA': {
    key: 'Medial OA',
    shortName: 'Medial Osteoarthritis',
    category: 'Cartilage/OA',
    description: 'Medial compartment joint space narrowing, subchondral sclerosis, osteophytosis, and articular cartilage thinning/ulceration.',
    primaryPlane: 'Coronal',
    keySequence: 'Coronal T1 / Coronal PD',
    clinicalSignificance: 'Most common compartmental knee OA; leads to varus deformity, chronic pain, and joint failure.',
    color: '#8b5cf6',
    urgencyTier: 'Conservative Management',
    clinicalRecommendations: [
      'Lifestyle management: structured low-impact aerobic exercise (swimming, cycling) and targeted weight reduction if indicated.',
      'Medial unloader brace or lateral wedged shoe insoles to shift mechanical axis away from worn medial compartment.',
      'Consider intra-articular hyaluronic acid or corticosteroid injection for flare-up pain management.'
    ],
    surgicalIndication: 'End-stage (Kellgren-Lawrence Grade IV) with bone-on-bone contact, refractory pain, or severe varus malalignment (Unicompartmental or Total Knee Arthroplasty).',
    conservativeProtocol: 'Comprehensive knee osteoarthritis exercise regimen: open-chain quadriceps hypertrophy, gluteal strengthening, and core stabilization.',
    imagingFollowUp: 'Bilateral full-leg weight-bearing standing long-leg radiographs every 12-24 months to quantify mechanical axis deviation.',
    mlModelingRecommendations: [
      'Coronal T1 and Coronal PD are premier sequences; train bone surface curvature and joint space gap regression heads.',
      'Augment training set with synthetic mild joint space narrowing to sharpen boundary discrimination.'
    ]
  },
  'Lateral OA': {
    key: 'Lateral OA',
    shortName: 'Lateral Osteoarthritis',
    category: 'Cartilage/OA',
    description: 'Cartilage denudation, subchondral remodeling, and marginal osteophytes in the lateral femorotibial joint compartment.',
    primaryPlane: 'Coronal',
    keySequence: 'Coronal PD-FS / T1',
    clinicalSignificance: 'Associated with valgus alignment; less common than medial OA but significantly impacts gait and mobility.',
    color: '#a855f7',
    urgencyTier: 'Conservative Management',
    clinicalRecommendations: [
      'Prescribe valgus unloader orthosis and medial arch supports to reduce lateral compartment peak contact forces.',
      'Targeted physical therapy emphasizing vastus medialis obliquus and tensor fasciae latae stretching/strengthening balance.',
      'Judicious oral NSAIDs or topical diclofenac sodium gel for acute symptom control.'
    ],
    surgicalIndication: 'Severe unremitting lateral joint space collapse with valgus deformity exceeding 10-12° (Distal Femoral Osteotomy or TKA).',
    conservativeProtocol: 'Low-impact cardiovascular conditioning, aquatic therapy, and progressive resistance leg extension protocols.',
    imagingFollowUp: 'Annual standing posteroanterior (Rosenberg 45° flexion) views to monitor chondral thinning rate.',
    mlModelingRecommendations: [
      'Due to class rarity (lowest base rate ~4%), apply Asymmetric Focal Loss with gamma=2.5 and positive sample oversampling.',
      'Fuse coronal bone signal with sagittal cartilage thickness profiles.'
    ]
  },
  'PF OA': {
    key: 'PF OA',
    shortName: 'Patellofemoral OA',
    category: 'Cartilage/OA',
    description: 'Chondral fissuring/full-thickness loss on patellar facets or trochlear groove with subchondral cystic changes.',
    primaryPlane: 'Axial',
    keySequence: 'Axial PD-FS / T2',
    clinicalSignificance: 'Causes anterior knee pain during stairs, squats, and prolonged sitting (theater sign).',
    color: '#d946ef',
    urgencyTier: 'Conservative Management',
    clinicalRecommendations: [
      'Patellar taping (McConnell taping) or patellofemoral tracking brace to optimize patellar groove trajectory.',
      'Avoid deep knee flexion past 60° under load, steep incline hiking, and excessive loaded lunges.',
      'Ergonomic adjustment of workstation and seating to avoid prolonged fixed knee hyperflexion.'
    ],
    surgicalIndication: 'Refractory patellofemoral maltracking with severe subluxation, trochlear dysplasia, or isolated severe lateral facet arthrosis.',
    conservativeProtocol: 'Vastus medialis obliquus (VMO) targeted neuromuscular training, hip external rotator strengthening, and IT band myofascial release.',
    imagingFollowUp: 'Merchant / Sunrise axial radiographs at 12 months to assess patellar tilt angle and sulcus angle.',
    mlModelingRecommendations: [
      'Axial PD-FS is the mandatory diagnostic plane; ensure axial slice crop contains full patella and trochlear sulcus.',
      'Utilize slice-wise maximum pooling across the 5 central axial slices covering the patellar articulating facets.'
    ]
  },
  'Effusion': {
    key: 'Effusion',
    shortName: 'Joint Effusion',
    category: 'Fluid/Inflammation',
    description: 'Hyperintense T2 fluid distending the suprapatellar bursa, retrofemoral space, or parapatellar recesses (>5mm AP depth).',
    primaryPlane: 'Sagittal',
    keySequence: 'Sagittal T2-FS / Axial T2',
    clinicalSignificance: 'Objective hallmark of internal joint derangement, hemarthrosis, or acute/chronic synovitis.',
    color: '#3b82f6',
    urgencyTier: 'Moderate Orthopedic',
    clinicalRecommendations: [
      'Evaluate for acute hemarthrosis vs clear inflammatory serous effusion; assess for ligamentous or capsular tear.',
      'Compressive cryotherapy and elastic tubular knee sleeve application to accelerate lymphatic resorption.',
      'Diagnostic or therapeutic arthrocentesis (aspiration) if severe tense capsular distension causing neurovascular or flexion block.'
    ],
    surgicalIndication: 'Aspiration indicated for tense pain relief or crystal/septic analysis; surgical drainage if purulent septic arthritis suspected.',
    conservativeProtocol: 'Elevation above heart level, pneumatic intermittent cryo-compression, and gentle passive range of motion.',
    imagingFollowUp: 'Clinical bedside ultrasound or follow-up MRI in 4-6 weeks to ensure complete resolution of fluid distension.',
    mlModelingRecommendations: [
      'Suprapatellar bursa depth on sagittal midline slices provides 98% accuracy; use simple fluid-mask segmentation auxiliary head.',
      'Ensure high threshold specificity (>0.45) to avoid labeling physiologic joint fluid (<3mm) as pathology.'
    ]
  },
  'Synovitis': {
    key: 'Synovitis',
    shortName: 'Synovial Hypertrophy',
    category: 'Fluid/Inflammation',
    description: 'Diffuse or nodular thickening and irregular frond-like papillary enhancement of the synovium.',
    primaryPlane: 'Axial',
    keySequence: 'Axial T2-FS / Contrast T1',
    clinicalSignificance: 'Indicates inflammatory arthropathy (rheumatoid, crystalline) or chronic post-traumatic reactive inflammation.',
    color: '#14b8a6',
    urgencyTier: 'Moderate Orthopedic',
    clinicalRecommendations: [
      'Rheumatology consultation and serum laboratory workup (ESR, CRP, RF, Anti-CCP, Uric Acid, ANA) if polyarticular or bilateral.',
      'Oral anti-inflammatory regimen or disease-modifying antirheumatic drugs (DMARDs) as directed by specialist.',
      'Intra-articular triamcinolone acetonide steroid injection for persistent inflammatory proliferative pannus.'
    ],
    surgicalIndication: 'Pigmented villonodular synovitis (PVNS/TGCT) or recalcitrant pannus causing bone erosions (Arthroscopic or open synovectomy).',
    conservativeProtocol: 'Cryotherapy, gentle range of motion preservation, and avoidance of heat during acute inflammatory exacerbations.',
    imagingFollowUp: 'Contrast-enhanced MRI (T1 post-gadolinium) in 3 months to evaluate reduction in synovial volumetric enhancement.',
    mlModelingRecommendations: [
      'Historically the most challenging RSNA target; implement Axial + Coronal T2-FS contrast normalization and report text cross-attention.',
      'Weight the synovitis loss component 1.5x in the overall multi-task objective function to boost weak-target performance.'
    ]
  },
  "Baker's": {
    key: "Baker's",
    shortName: "Baker's Cyst",
    category: 'Fluid/Inflammation',
    description: 'Fluid distension of the gastrocnemius-semimembranosus bursa in the posteromedial popliteal fossa.',
    primaryPlane: 'Axial',
    keySequence: 'Axial & Sagittal T2-FS',
    clinicalSignificance: 'Secondary to chronic joint effusion and meniscal pathology; can cause posterior tightness or pseudothrombophlebitis if ruptured.',
    color: '#10b981',
    urgencyTier: 'Conservative Management',
    clinicalRecommendations: [
      'Treat the primary intra-articular driver (medial meniscal tear, cartilage erosion, or chronic effusion).',
      'Ultrasound-guided aspiration and corticosteroid injection into the cyst neck if symptomatic posterior popliteal pain or neurovascular pressure.',
      'Patient education on warning signs of acute rupture into calf (mimicking deep vein thrombosis / DVT).'
    ],
    surgicalIndication: 'Open cystectomy or arthroscopic valve debridement reserved exclusively for recurrent, painful giant cysts failing conservative care.',
    conservativeProtocol: 'Posterior chain hamstring and calf stretching, compressive sleeve, and low-impact activity modulation.',
    imagingFollowUp: 'Duplex Doppler ultrasound if sudden calf swelling occurs to definitively rule out popliteal vein thrombosis / pseudothrombophlebitis.',
    mlModelingRecommendations: [
      'Axial and Sagittal T2-FS posteromedial quadrant bounding crops achieve near-perfect classification (>0.96 AUC).',
      'Look for the characteristic "neck" between gastrocnemius medial head and semimembranosus tendon.'
    ]
  },
  'Contusion': {
    key: 'Contusion',
    shortName: 'Bone Contusion / Edema',
    category: 'Bone/Trauma',
    description: 'Geographic, reticular high T2/STIR bone marrow signal without cortical breach; trabecular microfractures.',
    primaryPlane: 'Sagittal',
    keySequence: 'Sagittal STIR / PD-FS',
    clinicalSignificance: 'Pathognomonic "footprint" of acute trauma mechanism (e.g. lateral femoral condyle + posterior lateral tibial plateau in ACL pivot shift).',
    color: '#eab308',
    urgencyTier: 'Moderate Orthopedic',
    clinicalRecommendations: [
      'Protected weight-bearing (crutches / walker) for 2 to 4 weeks to prevent subchondral trabecular collapse or osteochondral injury.',
      'Prescribe calcium and Vitamin D supplementation to support bone marrow remodeling and osteogenesis.',
      'Correlate bone bruise pattern to rule out associated occult ligamentous tears (e.g., pivot shift vs hyperextension vs dashboard contusion).'
    ],
    surgicalIndication: 'Non-surgical entity; surgery only required if overlying articular cartilage has delaminated or formed a displaced osteochondral fragment.',
    conservativeProtocol: 'Graduated partial-to-full weight bearing over 4-6 weeks as focal bone tenderness subsides; progressive low-impact cycling.',
    imagingFollowUp: 'Follow-up MRI in 8-12 weeks for high-impact athletes to confirm resolution of bone marrow edema prior to return-to-sport clearance.',
    mlModelingRecommendations: [
      'Sagittal and Coronal STIR / PD-FS sequences demonstrate maximum signal contrast; apply high-pass marrow signal thresholding.',
      'Pair contusion features with ACL and Meniscal prediction heads to utilize anatomic trauma synergy.'
    ]
  },
  'Fracture': {
    key: 'Fracture',
    shortName: 'Occult / Cortical Fracture',
    category: 'Bone/Trauma',
    description: 'Linear low T1 signal with cortical interruption or impaction (e.g. Segond avulsion, tibial plateau depression).',
    primaryPlane: 'Coronal',
    keySequence: 'Coronal T1 / PD-FS',
    clinicalSignificance: 'High risk of joint instability and secondary collapse; mandates immediate orthopedic weight-bearing restrictions.',
    color: '#f43f5e',
    urgencyTier: 'Urgent Surgical',
    clinicalRecommendations: [
      'Strict non-weight-bearing (NWB) with axillary crutches and immediate orthopedic trauma surgeon consultation.',
      'Immobilize in knee extension splint or hinged brace locked at 0° pending surgical fracture fixation evaluation.',
      'Assess distal neurovascular integrity (peroneal nerve function, dorsalis pedis and posterior tibial pulses).'
    ],
    surgicalIndication: 'Tibial plateau depression >2-3mm, cortical displacement, articular incongruity, or unstable avulsion fractures (e.g., Segond avulsion with multiligament injury).',
    conservativeProtocol: 'Non-displaced stable fractures: 6-8 weeks non-weight bearing immobilization followed by structured passive-to-active ROM physical therapy.',
    imagingFollowUp: 'Immediate non-contrast 3D CT scan of the knee for accurate sub-millimeter fracture characterization and pre-operative surgical mapping.',
    mlModelingRecommendations: [
      'Coronal T1 and Coronal PD-FS are paramount; incorporate dual-window high-resolution bone edge detection kernels.',
      'Ensure high sensitivity threshold (0.35) to prevent catastrophic false negatives in occult cortical disruption.'
    ]
  }
};

export const ALL_ABNORMALITY_KEYS: AbnormalityKey[] = [
  'ACL',
  'MCL',
  'Medial Meniscus',
  'Lateral Meniscus',
  'Medial OA',
  'Lateral OA',
  'PF OA',
  'Effusion',
  'Synovitis',
  "Baker's",
  'Contusion',
  'Fracture'
];

export const ABNORMALITY_KEY_SLICES: Record<AbnormalityKey, { plane: ViewPlane; slice: number }> = {
  'ACL': { plane: 'Sagittal', slice: 12 },
  'MCL': { plane: 'Coronal', slice: 10 },
  'Medial Meniscus': { plane: 'Sagittal', slice: 10 },
  'Lateral Meniscus': { plane: 'Coronal', slice: 10 },
  'Medial OA': { plane: 'Coronal', slice: 10 },
  'Lateral OA': { plane: 'Coronal', slice: 10 },
  'PF OA': { plane: 'Axial', slice: 8 },
  'Effusion': { plane: 'Sagittal', slice: 12 },
  'Synovitis': { plane: 'Axial', slice: 8 },
  "Baker's": { plane: 'Axial', slice: 14 },
  'Contusion': { plane: 'Sagittal', slice: 8 },
  'Fracture': { plane: 'Coronal', slice: 10 }
};

export const CATEGORY_COLORS = {
  Ligament: 'border-red-500/30 text-red-400 bg-red-500/10',
  Meniscus: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  'Cartilage/OA': 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  'Fluid/Inflammation': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  'Bone/Trauma': 'border-amber-500/30 text-amber-400 bg-amber-500/10'
};
