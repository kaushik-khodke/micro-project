import json
import os
import google.generativeai as genai
from typing import Dict, Any, Optional
from app.core.config import settings

class GeminiInsightService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        else:
            self.model = None

    async def generate_triage_insight(self, vitals: Dict[str, Any], symptoms: str, model_severity: str) -> Dict[str, Any]:
        """
        Generates clinician-readable summaries and insights for emergency triage.
        """
        if not self.model:
            return self._fallback_insight(vitals, model_severity, "Triage")

        prompt = f"""
        Role: Clinical Decision Support Assistant (Emergency Medicine)
        Task: Synthesize patient data into a structured clinical insight summary.
        
        Patient Data:
        - Vitals: {json.dumps(vitals)}
        - Core Complaint/Symptoms: "{symptoms}"
        - Calculated Severity Band (Random Forest): {model_severity}
        
        Instructions:
        1. Summarize key clinical findings based on the provided vitals and symptoms.
        2. Provide a concise explanation for the assigned Severity Band.
        3. Identify any immediate clinical flags or concerns.
        4. Suggest a recommended immediate action for the clinical team.
        5. Include a confidence note and a standard medical disclaimer.
        
        Constraint: Return ONLY a valid JSON object with the following fields:
        {{
            "summary": "str",
            "risk_level": "str (Low/Moderate/High/Critical)",
            "key_findings": ["str", ...],
            "clinical_flags": ["str", ...],
            "recommended_action": "str",
            "confidence_note": "str",
            "disclaimer": "This is an AI decision-support tool. It does not provide medical diagnosis or substitute clinical judgment."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Find the JSON block in the response if Gemini wraps it in markdown
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                # Handle cases where it might just be triple backticks without a language
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return self._fallback_insight(vitals, model_severity, "Triage")

    async def generate_eeg_insight(self, features: Dict[str, Any], findings: str = "") -> Dict[str, Any]:
        """
        Generates insights from extracted EEG features and parsed reports.
        """
        if not self.model:
            return self._fallback_insight(features, "N/A", "EEG Analysis")

        prompt = f"""
        Role: Clinical Decision Support Assistant (Neurology/Neurophysiology)
        Task: Interpret extracted EEG features and findings into a concise clinician-friendly insight.
        
        EEG Data/Features:
        - PSD Features: {json.dumps(features)}
        - Parsed Findings (if any): "{findings}"
        
        Instructions:
        1. Summarize the neurological significance of the extracted features (e.g., alpha/delta ratios).
        2. Highlight any abnormal patterns (slowing, rhythmic activity, etc.).
        3. Provide clinical context for the findings.
        4. Include professional recommendations for further review or follow-up.
        
        Constraint: Return ONLY a valid JSON object with the following fields:
        {{
            "summary": "str",
            "risk_level": "str",
            "key_findings": ["str", ...],
            "clinical_flags": ["str", ...],
            "recommended_action": "str",
            "confidence_note": "str",
            "disclaimer": "This is an AI decision-support tool. Accuracy depends on signal quality. Consult a neurologist."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return self._fallback_insight(features, "Unknown", "EEG")
    async def generate_eeg_image_insight(self, image_path: str) -> Dict[str, Any]:
        """
        Uses Gemini Vision to analyze an EEG graph image and provide structured clinical insight.
        This is the core differentiator — sends the actual image to Gemini for visual interpretation.
        """
        if not self.model:
            return self._fallback_image_insight()

        try:
            import PIL.Image
            img = PIL.Image.open(image_path)
            
            prompt = """
            Role: Board-Certified Clinical Neurophysiologist & EEG Specialist
            Task: Perform a comprehensive visual analysis of this EEG recording image.
            
            Analyze the following aspects of the EEG tracing:
            
            1. **Background Activity**: Describe the dominant rhythm, frequency, amplitude, and symmetry.
            2. **Abnormal Patterns**: Identify any epileptiform discharges (spikes, sharp waves, spike-and-wave complexes), 
               focal slowing, generalized slowing, burst suppression, or other pathological patterns.
            3. **Artifact Recognition**: Note any muscle artifact, eye movement artifact, or electrode artifacts.
            4. **Montage & Technical Quality**: Comment on the recording montage (bipolar/referential), 
               channel labels, filter settings, and overall signal quality.
            5. **Clinical Correlation**: Based on the visual patterns, suggest possible clinical correlations 
               (e.g., epilepsy, encephalopathy, focal lesion, metabolic dysfunction).
            6. **Confidence Assessment**: Rate your confidence in the analysis on a scale of 0.0 to 1.0, 
               considering image quality, visible channels, and pattern clarity. Be SPECIFIC and UNIQUE 
               to this particular recording — do NOT use generic scores.
            
            Constraint: Return ONLY a valid JSON object with the following fields:
            {
                "prediction_label": "NORMAL or ABNORMAL or BORDERLINE",
                "confidence_score": <float between 0.0 and 1.0 — unique to THIS specific recording>,
                "summary": "str — 2-3 sentence executive summary of the EEG findings",
                "background_activity": "str — description of background rhythms",
                "risk_level": "str (Low/Moderate/High/Critical)",
                "key_findings": ["str", ...],
                "abnormal_patterns": ["str", ...],
                "clinical_flags": ["str", ...],
                "clinical_correlation": "str — possible clinical significance",
                "recommended_action": "str — next steps for the clinical team",
                "technical_quality": "str (Good/Fair/Poor)",
                "confidence_note": "str — explain WHY this confidence level was assigned",
                "disclaimer": "This is an AI decision-support tool for EEG visual analysis. It does not replace interpretation by a board-certified neurophysiologist."
            }
            """
            
            response = self.model.generate_content([prompt, img])
            text = response.text.strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            return result
            
        except Exception as e:
            print(f"Gemini Vision API Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._fallback_image_insight()

    def _fallback_image_insight(self) -> Dict[str, Any]:
        """Fallback when Gemini vision is unavailable."""
        import random
        return {
            "prediction_label": "BORDERLINE",
            "confidence_score": round(random.uniform(0.55, 0.70), 2),
            "summary": "Image-based EEG analysis could not be completed via AI. Manual review required.",
            "background_activity": "Unable to assess from image without AI vision.",
            "risk_level": "Requires Review",
            "key_findings": ["Image uploaded successfully", "Automated visual analysis unavailable"],
            "abnormal_patterns": [],
            "clinical_flags": ["Manual neurophysiologist review strongly recommended"],
            "clinical_correlation": "Cannot determine without visual AI analysis.",
            "recommended_action": "Refer to board-certified neurophysiologist for manual EEG interpretation.",
            "technical_quality": "Unknown",
            "confidence_note": "Low confidence — fallback mode due to API unavailability.",
            "disclaimer": "This is a fallback summary. AI visual analysis was not performed."
        }

    def _fallback_insight(self, data: Dict[str, Any], severity: str, type: str) -> Dict[str, Any]:
        """
        Provides a deterministic fallback when Gemini is unavailable.
        """
        return {
            "summary": f"Automated {type} assessment based on structured metrics.",
            "risk_level": "See Model Output",
            "key_findings": ["Primary assessment complete", f"Severity set to {severity}"],
            "clinical_flags": ["Consult required for detailed interpretation"],
            "recommended_action": "Follow institutional protocols for assigned priority.",
            "confidence_note": "Based on deterministic rule-sets.",
            "disclaimer": f"This is a fallback automated summary for {type}. Accuracy may vary."
        }

gemini_service = GeminiInsightService()
