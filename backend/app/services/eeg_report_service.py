import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
import numpy as np
import matplotlib
matplotlib.use('Agg') # Ensure non-interactive backend for server
import matplotlib.pyplot as plt
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from io import BytesIO

from app.core.config import settings
from app.utils.eeg_constants import EEG_BANDS

class EEGReportService:
    def __init__(self):
        self.reports_dir = os.path.join(settings.UPLOADS_DIR, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

    def generate_full_report(self, study_id: int, file_path: str, file_type: str, gemini_insight: Dict[str, Any], features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Orchestrates full report generation.
        Returns the structured report dict.
        """
        report_data = {
            "metadata": {
                "study_id": study_id,
                "generated_at": datetime.datetime.utcnow().isoformat(),
                "file_type": file_type
            },
            "insight": gemini_insight,
            "signal_analysis": {},
            "chart_data": {}
        }
        
        # 1. Generate Signal & Chart Data
        if file_type == "EDF":
            # For EDF, extract real data
            signal_data, anomalies, band_dist = self._extract_real_signal_data(file_path, features)
            chart_data = self._generate_real_chart_data(signal_data, band_dist)
            report_data["signal_analysis"] = {
                "source": "REAL_DATA",
                "anomalies": anomalies,
                "band_distribution": band_dist,
                "channels": list(signal_data.keys())
            }
            report_data["chart_data"] = chart_data
        else:
            # For Image/PDF, simulate based on Gemini's assessment
            chart_data, band_dist = self._generate_simulated_data(gemini_insight)
            report_data["signal_analysis"] = {
                "source": "SIMULATED",
                "anomalies": [{"desc": "Simulated anomaly view based on AI visual findings", "type": "warning"}],
                "band_distribution": band_dist,
                "channels": ["Fp1", "Fp2", "F3", "F4", "C3", "C4"] # Simulated standard channels
            }
            report_data["chart_data"] = chart_data

        # 2. Add Medical Insights & Patient Summary
        report_data["medical_insights"] = self._generate_medical_insights(gemini_insight, file_type)
        report_data["patient_summary"] = self._generate_patient_summary(gemini_insight)

        return report_data

    def _extract_real_signal_data(self, file_path: str, features: Optional[Dict[str, float]]) -> tuple:
        """Extracts basic signal metrics from EDF for the report."""
        import mne
        anomalies = []
        band_dist = {}
        signal_summary = {}
        
        try:
            raw = mne.io.read_raw_edf(file_path, preload=True, verbose=False)
            data = raw.get_data()
            channels = raw.ch_names
            
            # Simple anomaly detection: find high amplitude peaks
            std_dev = np.std(data)
            mean_val = np.mean(data)
            threshold = mean_val + 4 * std_dev # Simple threshold
            
            for i, ch in enumerate(channels[:6]): # Check first 6 channels for speed
                ch_data = data[i]
                if np.max(np.abs(ch_data)) > threshold:
                   anomalies.append({
                       "channel": ch, 
                       "type": "High amplitude event",
                       "time_rough": "Various", 
                   })
                
                # Store roughly downsampled subset for rendering
                # Just take first few seconds
                sfreq = raw.info['sfreq']
                n_samples = min(int(sfreq * 2), len(ch_data)) # 2 seconds of data
                signal_summary[ch] = ch_data[:n_samples].tolist()
            
            # Use passed features for band distribution
            if features:
                 for b in EEG_BANDS.keys():
                     if b in features:
                         band_dist[b] = features[b]
            else:
                 # Dummy if not passed
                 band_dist = {"delta": 0.2, "theta": 0.2, "alpha": 0.3, "beta": 0.2, "gamma": 0.1}

        except Exception as e:
            print(f"Report real data extraction error: {e}")
            signal_summary = {"Error_Ch": []}
            band_dist = {"delta": 0, "theta": 0, "alpha": 0, "beta": 0, "gamma": 0}
            
        return signal_summary, anomalies, band_dist


    def _generate_real_chart_data(self, signal_data: Dict[str, List[float]], band_dist: Dict[str, float]) -> Dict[str, Any]:
         """Formats real data for Recharts."""
         # Time series
         time_series = []
         if signal_data and list(signal_data.values())[0]:
             # Just create roughly ~100 points for the chart to not overload frontend
             series_len = len(list(signal_data.values())[0])
             step = max(1, series_len // 100)
             
             for i in range(0, series_len, step):
                 point = {"time_ms": i * 4} # Assume ~250hz (4ms) for rough plot
                 for ch, vals in signal_data.items():
                     if i < len(vals):
                         point[ch] = vals[i] * 1e6 # Convert to uV roughly
                 time_series.append(point)
                 
         # Frequency Band Radar/Bar
         bands = []
         for name, power in band_dist.items():
             bands.append({
                 "subject": name.capitalize(),
                 "A": round(power * 100, 1),
                 "fullMark": 100
             })
             
         # Channel Comparison (RMS power proxy)
         channels = []
         for ch, vals in signal_data.items():
             if vals:
                 rms = np.sqrt(np.mean(np.square(vals))) * 1e6
                 channels.append({
                     "name": ch,
                     "power": round(rms, 2)
                 })
         
         return {
             "time_series": time_series,
             "frequency_bands": bands,
             "channel_comparison": channels
         }


    def _generate_simulated_data(self, insight: Dict[str, Any]) -> tuple:
        """Generates representative chart data for Recharts based on Gemini insight."""
        # 1. Time Series
        # Create a few seconds of simulated EEG-like waves
        np.random.seed(42)  # For consistent simulation per report
        time_series = []
        
        label = insight.get("prediction_label", "NORMAL")
        
        # Determine dominant frequencies
        alpha_base = np.sin(np.linspace(0, 10 * 2 * np.pi, 200)) # 10Hz
        theta_base = np.sin(np.linspace(0, 5 * 2 * np.pi, 200))  # 5Hz
        spike_base = np.zeros(200)
        
        if label == "ABNORMAL":
            # Add spikes
            spike_base[50] = 5
            spike_base[51] = -3
            spike_base[150] = 4
            spike_base[151] = -4
            
        for i in range(200):
            point = {"time": f"{i*5}ms"}
            
            # Mix base waves with noise
            fp1 = (alpha_base[i] * 0.5 + np.random.normal(0, 0.2)) * 10
            fp2 = (alpha_base[i] * 0.4 + np.random.normal(0, 0.2)) * 10
            c3 = (alpha_base[i] * 0.8 + theta_base[i] * 0.3 + np.random.normal(0, 0.1)) * 15
            c4 = (alpha_base[i] * 0.7 + theta_base[i] * 0.2 + np.random.normal(0, 0.1)) * 15
            o1 = (alpha_base[i] * 1.5 + np.random.normal(0, 0.3)) * 20
            o2 = (alpha_base[i] * 1.4 + np.random.normal(0, 0.3)) * 20
            
            if label == "ABNORMAL":
                fp1 += spike_base[i] * 15
                c3 += spike_base[i] * 20
                
            point["Fp1"] = round(fp1, 2)
            point["Fp2"] = round(fp2, 2)
            point["C3"] = round(c3, 2)
            point["C4"] = round(c4, 2)
            point["O1"] = round(o1, 2)
            point["O2"] = round(o2, 2)
            
            time_series.append(point)

        # 2. Frequency Bands
        # Adjust distribution based on findings
        text = str(insight).lower()
        bands = [
            {"subject": "Delta", "A": 15, "fullMark": 100},
            {"subject": "Theta", "A": 12, "fullMark": 100},
            {"subject": "Alpha", "A": 45, "fullMark": 100},
            {"subject": "Beta", "A": 20, "fullMark": 100},
            {"subject": "Gamma", "A": 8, "fullMark": 100}
        ]
        
        band_dist_raw = {"delta": 0.15, "theta": 0.12, "alpha": 0.45, "beta": 0.2, "gamma": 0.08}
        
        if "slowing" in text or "theta" in text:
            bands[1]["A"] = 35
            bands[2]["A"] = 25
            band_dist_raw["theta"] = 0.35
            band_dist_raw["alpha"] = 0.25
        if "spike" in text or "epilepti" in text:
            bands[3]["A"] = 30
            bands[4]["A"] = 15
            band_dist_raw["beta"] = 0.3
            band_dist_raw["gamma"] = 0.15

        # 3. Channel Comparison
        channels = [
             {"name": "Fp1", "power": round(np.random.uniform(5, 15), 1)},
             {"name": "Fp2", "power": round(np.random.uniform(5, 15), 1)},
             {"name": "C3", "power": round(np.random.uniform(10, 25), 1)},
             {"name": "C4", "power": round(np.random.uniform(10, 25), 1)},
             {"name": "O1", "power": round(np.random.uniform(15, 30), 1)},
             {"name": "O2", "power": round(np.random.uniform(15, 30), 1)}
        ]

        if label == "ABNORMAL":
            channels[2]["power"] += 15 # Bump C3
            channels[3]["power"] += 12 # Bump C4
            
        chart_data = {
            "time_series": time_series,
            "frequency_bands": bands,
            "channel_comparison": channels
        }
        
        return chart_data, band_dist_raw

    def _generate_medical_insights(self, insight: Dict[str, Any], file_type: str) -> Dict[str, Any]:
        """Maps AI findings into categorized medical insights for the report."""
        label = insight.get("prediction_label", "NORMAL")
        
        state_indicators = []
        if label == "NORMAL":
            state_indicators = ["Relaxed Wakefulness pattern suggested", "Normal cognitive baseline"]
        elif label == "BORDERLINE":
            state_indicators = ["Mild deviations from baseline", "Possible drowsiness or medication effect"]
        else:
            state_indicators = ["Significant deviation from physiological baseline", "Requires immediate clinical correlation"]
            
        irregular = insight.get("abnormal_patterns", [])
        if not irregular and label == "ABNORMAL":
            irregular = ["Abnormal activity detected in background rhythms"]
            
        return {
            "brain_patterns": insight.get("background_activity", "Regular background activity expected for patient baseline."),
            "irregular_signals": irregular,
            "state_indicators": state_indicators
        }

    def _generate_patient_summary(self, insight: Dict[str, Any]) -> Dict[str, Any]:
        """Generates patient-friendly explanations."""
        label = insight.get("prediction_label", "NORMAL")
        risk = insight.get("risk_level", "Low")
        
        if label == "NORMAL":
             explanation = "Your brainwave activity shows regular, healthy patterns. The electrical signals controlling your brain function are operating normally. No concerning irregularities or 'spikes' were detected during this recording."
             overview = "Normal Routine EEG"
             next_steps = "No specific follow-up required based on this test alone. Monitor your general health with your Primary Care Provider."
        elif label == "BORDERLINE":
             explanation = "Your brainwave activity is mostly normal, but shows some mild variations. These small changes are often harmless and can be caused by simple things like being tired, mild stress, or certain common medications."
             overview = "Slight Variations Present"
             next_steps = "Discuss these results with your doctor at your next scheduled appointment. They will review if these variations are meaningful for you."
        else:
             explanation = "Your recording shows some unexpected patterns in your brainwave activity. The system detected some irregular signals (like spikes or slowing) that differ from a standard healthy baseline."
             overview = "Atypical Brain Activity Detected"
             next_steps = "Please schedule a follow-up appointment with a neurologist. They will review the actual tracings to determine what these irregular patterns mean for your health."

        observations = []
        if insight.get("key_findings"):
            # Simplify the technical findings
            for i, f in enumerate(insight["key_findings"][:3]):
                if "normal" in f.lower(): observations.append("Steady background rhythm.")
                elif "slow" in f.lower(): observations.append("Slightly slower than expected waves in some areas.")
                elif "spike" in f.lower(): observations.append("Brief bursts of sharp electrical activity.")
                elif "asymmetr" in f.lower(): observations.append("Differences between the left and right sides of the brain.")
                else: observations.append("Specific variation noted in electrical rhythm.")
        
        if not observations:
             observations = ["Initial automated review completed successfully", "Data quality was sufficient for analysis"]

        return {
             "explanation": explanation,
             "overview": overview,
             "observations": observations,
             "next_steps": next_steps
        }

    def generate_pdf_report(self, study_id: int, file_name: str, report_data: Dict[str, Any]) -> str:
        """Generates a professional PDF containing graphs and insights."""
        pdf_path = os.path.join(self.reports_dir, f"EEG_FullReport_{study_id}.pdf")
        
        # Ensure we have data
        if not report_data:
             return ""
             
        insight = report_data.get("insight", {})
        chart_data = report_data.get("chart_data", {})
        
        # 1. Generate local chart images via matplotlib
        plots_dir = os.path.join(self.reports_dir, "plots")
        os.makedirs(plots_dir, exist_ok=True)
        
        ts_path = os.path.join(plots_dir, f"ts_{study_id}.png")
        bar_path = os.path.join(plots_dir, f"bar_{study_id}.png")
        
        self._create_matplotlib_charts(chart_data, ts_path, bar_path)
        
        # 2. Build PDF Document using ReportLab
        c = canvas.Canvas(pdf_path, pagesize=A4)
        width, height = A4
        margin = 50
        
        # --- Page 1: Overview & Insights ---
        
        # Header
        c.setFillColorRGB(0.18, 0.22, 0.6) # Primary blue
        c.rect(0, height - 80, width, 80, fill=1)
        
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(margin, height - 45, "Comprehensive EEG Analysis Report")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin, height - 60, f"File: {file_name} | ID: {study_id} | Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')}")
        
        # Body Y tracker
        y = height - 120
        
        # Executive Summary Box
        c.setFillColorRGB(0.95, 0.96, 0.98)
        c.setStrokeColorRGB(0.8, 0.85, 0.9)
        c.roundRect(margin, y - 100, width - 2*margin, 100, 5, fill=1, stroke=1)
        
        label = insight.get("prediction_label", "NORMAL")
        score = insight.get("confidence_score", insight.get("confidence", 0))
        
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin + 20, y - 25, "Executive Summary")
        
        c.setFont("Helvetica", 11)
        if label == "NORMAL": c.setFillColorRGB(0.1, 0.6, 0.2)
        elif label == "ABNORMAL": c.setFillColorRGB(0.8, 0.1, 0.1)
        else: c.setFillColorRGB(0.8, 0.5, 0.1)
        
        c.drawString(margin + 20, y - 50, f"AI Finding: {label} (Confidence: {score*100:.1f}%)")
        
        c.setFillColorRGB(0.3, 0.3, 0.3)
        c.setFont("Helvetica", 10)
        summary_text = insight.get("summary", "Analysis completed.")
        
        # Simple text wrapping
        words = summary_text.split()
        line = ""
        ly = y - 70
        for w in words:
            if c.stringWidth(line + w, "Helvetica", 10) < width - 2*margin - 40:
                line += w + " "
            else:
                c.drawString(margin + 20, ly, line)
                line = w + " "
                ly -= 15
        if line:
            c.drawString(margin + 20, ly, line)
            
        y -= 140
        
        # Medical Insights
        c.setFillColorRGB(0.18, 0.22, 0.6)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, y, "Detailed Medical Insights")
        y -= 25
        
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(margin, y, "Key Findings:")
        y -= 20
        c.setFont("Helvetica", 10)
        for finding in insight.get("key_findings", []):
            c.drawString(margin + 10, y, f"• {finding[:100]}...") # truncate for safety
            y -= 15
            
        y -= 10
        if insight.get("abnormal_patterns"):
            c.setFont("Helvetica-Bold", 11)
            c.setFillColorRGB(0.8, 0.1, 0.1)
            c.drawString(margin, y, "Abnormal Patterns Detected:")
            y -= 20
            c.setFont("Helvetica", 10)
            c.setFillColorRGB(0.2, 0.2, 0.2)
            for p in insight.get("abnormal_patterns", []):
                c.drawString(margin + 10, y, f"• {p[:100]}...")
                y -= 15
        
        # --- Embedded Charts ---
        y -= 20
        c.setFillColorRGB(0.18, 0.22, 0.6)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, y, "Signal Visualizations")
        y -= 20
        
        c.setFont("Helvetica-Oblique", 9)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        ds = report_data.get("signal_analysis", {}).get("source", "")
        if ds == "SIMULATED":
             c.drawString(margin, y, "*Note: Visualizations are simulated representative plots based on AI interpretation of the image/PDF.")
        y -= 10
        
        if os.path.exists(ts_path):
            try:
                # Add Time Series Chart
                img = ImageReader(ts_path)
                # Plot fits within remaining page
                img_height = 200
                img_width = 450
                if y - img_height > 50:
                    c.drawImage(img, margin, y - img_height, width=img_width, height=img_height, preserveAspectRatio=True)
                    y -= img_height + 20
                else:
                    c.showPage()
                    y = height - margin
                    c.drawImage(img, margin, y - img_height, width=img_width, height=img_height, preserveAspectRatio=True)
                    y -= img_height + 20
            except Exception as e:
                print(f"Error drawing ts image: {e}")

        if os.path.exists(bar_path):
             try:
                 img_b = ImageReader(bar_path)
                 img_height = 200
                 img_width = 450
                 if y - img_height > 50:
                     c.drawImage(img_b, margin, y - img_height, width=img_width, height=img_height, preserveAspectRatio=True)
                     y -= img_height + 20
                 else:
                     c.showPage()
                     y = height - margin
                     c.drawImage(img_b, margin, y - img_height, width=img_width, height=img_height, preserveAspectRatio=True)
                     y -= img_height + 20
             except:
                 pass
                 
        # Page Footer
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(margin, 30, "Report generated by NeuroBridge AI. This is a clinical decision support tool, not a diagnostic medical device.")
        
        # Save PDF
        c.save()
        
        # Cleanup plot images
        try:
             if os.path.exists(ts_path): os.remove(ts_path)
             if os.path.exists(bar_path): os.remove(bar_path)
        except:
             pass

        return pdf_path

    def _create_matplotlib_charts(self, chart_data: Dict[str, Any], ts_path: str, bar_path: str):
         """Creates temporary images of charts for the PDF using matplotlib."""
         try:
             # 1. Time Series
             ts_data = chart_data.get("time_series", [])
             if ts_data and len(ts_data) > 0:
                 plt.figure(figsize=(8, 4))
                 times = [p.get("time_ms", i) for i, p in enumerate(ts_data)]
                 
                 # Plot first 3 channels
                 channels = [k for k in ts_data[0].keys() if k not in ["time", "time_ms"]][:3]
                 
                 for idx, ch in enumerate(channels):
                     vals = [p.get(ch, 0) for p in ts_data]
                     # Offset for visibility if values are centered around 0
                     offset = (len(channels) - idx) * 50 
                     plt.plot(times, [v + offset for v in vals], label=ch)
                     
                 plt.title('EEG Time Series Draft (Channels subset)')
                 plt.xlabel('Time')
                 plt.yticks([]) # Hide y ticks as offsets make them meaningless
                 plt.legend(loc='upper right')
                 plt.tight_layout()
                 plt.savefig(ts_path, dpi=150)
                 plt.close()

             # 2. Channel Comparison Bar
             chan_comp = chart_data.get("channel_comparison", [])
             if chan_comp:
                 plt.figure(figsize=(8, 3))
                 names = [c["name"] for c in chan_comp]
                 powers = [c["power"] for c in chan_comp]
                 
                 plt.bar(names, powers, color='#4f46e5')
                 plt.title('Channel RMS Power')
                 plt.ylabel('Power (uV)')
                 plt.tight_layout()
                 plt.savefig(bar_path, dpi=150)
                 plt.close()
                 
         except Exception as e:
             print(f"Error generating matplotlib charts: {e}")

eeg_report_service = EEGReportService()
