import Header from "@/components/Header";
import { useEffect } from "react";

const Capstone = () => {
  useEffect(() => {
    // Load Instagram embed script if it hasn't been loaded
    if (!window.instgrm) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script already loaded, reprocess embeds
      window.instgrm.Embeds.process();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">
              Capstone Prototypes
            </h1>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold mb-4">
                  IndurAITb: AI-Powered Smartphone-Based Tuberculosis Skin Test
                  Interpretation
                </h2>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/932ZX9AKwGE?si=2oF_CrM5crodxXm_"
                  title="IndurAITb Pitch Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="space-y-8">
                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Project Overview
                  </h3>
                  <p className="text-lg mb-4">
                    As the final capstone project for my master's at Rice, I
                    developed an AI-powered diagnostic app for the Tuberculosis
                    Skin Test (TST). Dubbed IndurAITb, this app is a
                    smartphone-based tool designed to make it easier and more
                    accurate to interpret TSTs. These tests are used around the
                    world to check if someone has been exposed to TB, but
                    reading them correctly can be tricky and often depends on
                    the human-eye judgment from a healthcare worker.
                  </p>
                  <p className="text-lg">
                    IndurAITb takes the guesswork out using artificial
                    intelligence and computer vision to analyze the skin
                    reaction directly from a short video. It spots the swelling
                    (known as an “induration”) and measures it automatically,
                    reducing human error and saving time. The app is
                    lightweight, works offline, and can run on most mobile
                    devices, making it perfect for use in rural or
                    resource-limited settings. By giving health workers a
                    reliable, portable way to assess TSTs, IndurAITb can
                    potentially improve TB screening and follow-up around the
                    globe, especially where it’s needed most.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Technical Approach
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Machine Learning Techniques
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Vision Transformers</li>
                        <li>Feature Extraction</li>
                        <li>
                          Multi-frame Tracking/Temporal Consistency Modeling
                        </li>
                        <li>ML Classifiers</li>
                        <li>Zero-Shot Segmentation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Technologies Used
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python, SAM, Grounding DINO, PyTorch</li>
                        <li>Computer Vision Backend Pipeline</li>
                        <li>Browser-Based Interface</li>
                        <li>Encrypted Database Management</li>
                        <li>Camera Calibration Tools</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Results & Impact
                  </h3>
                  <p className="text-lg mb-4">
                    In controlled tests with synthetic and biologically relevant
                    surfaces, IndurAITb achieved reproducibility within ±5% of
                    manual expert measurements and reduced standard deviation by
                    about 20%. The results of IndurAITb show that AI-driven
                    segmentation and multi-frame refinement can significantly
                    reduce variability in TST interpretation. Using SAM and
                    SAM2, the system achieved consistent boundary detection and
                    stable induration measurements across video sequences,
                    outperforming single-image analysis. Shape-constrained
                    filtering reduced false positives, while multi-frame
                    averaging minimized outliers and improved alignment with
                    clinical benchmarks.
                  </p>
                  <p className="text-lg mb-4">
                    These tests validate the feasibility of deploying automated,
                    smartphone-based TST interpretation at scale. IndurAITb
                    addresses persistent challenges such as interrater
                    variability, patient noncompliance from return visits, and
                    cost inefficiencies by providing a reliable, low-cost, and
                    portable diagnostic tool. Its integration of AI segmentation
                    with mobile health technology suits it for both clinical and
                    remote settings, especially in high-burden or
                    resource-limited regions, like the Houston Medical Center.
                  </p>
                  <p className="text-lg">
                    Beyond individual diagnostics, the system could also
                    strengthen public health surveillance. By generating
                    standardized, real-time data, IndurAITb supports earlier
                    detection of tuberculosis and enables efficient large-scale
                    screening. This approach has the potential to close
                    diagnostic gaps, improve accessibility, and accelerate
                    progress toward global tuberculosis control.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Future Directions
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-lg">
                    <li>Integration with electronic health record systems</li>
                    <li>Optimization of AI model for mobile deployment</li>
                    <li>Collaboration with healthcare institutions</li>
                    <li>Clinical validation of AI system in real time</li>
                    <li>
                      Further development of interpretable metrics/tools for
                      medical professionals from their feedback
                    </li>
                  </ul>
                </section>

                <h2 className="text-center text-3xl font-semibold mb-4">
                  Breath of Life: SIDS Prediction System
                </h2>
                <p className="text-center text-xl text-muted-foreground">
                  Automating Healthcare Diagnostics through Machine Learning
                </p>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/dX1PIfC2Y28?si=hfZbYxMd-iYpJEUq"
                  title="Breath of Life Pitch Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="space-y-8">
                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Project Overview
                  </h3>
                  <p className="text-lg mb-4">
                    As part of my master's at Rice, my first capstone project
                    focused on developing a machine learning system to predict
                    Sudden Infant Death Syndrome (SIDS) using healthcare data.
                    More specifically, we integrated several data science
                    techniques to identify cardio-respiratory signatures and
                    patterns in SIDS.
                  </p>
                  <p className="text-lg">
                    By analyzing complex physiological datasets, my project
                    discovered key patterns that could provide early indicators
                    of mortality, ultimately contributing to advancements in
                    predictive healthcare systems.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Technical Approach
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Machine Learning Techniques
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Deep Neural Networks</li>
                        <li>Feature Engineering</li>
                        <li>Exploratory Data Analysis</li>
                        <li>Time Series Analysis</li>
                        <li>Ensemble Methods</li>
                        <li>Cross-validation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Technologies Used
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python: TensorFlow, Keras, Scikit-learn</li>
                        <li>Healthcare Data APIs</li>
                        <li>Statistical Testing</li>
                        <li>Signal Processing</li>
                        <li>ETL Pipelines</li>
                        <li>Model Validation</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Results & Impact
                  </h3>
                  <p className="text-lg mb-4">
                    The system achieved over 85% accuracy in predicting fatal
                    outcomes by developing robust convolutional models
                    demonstrating the potential for machine learning to assist
                    in early detection of risk factors associated with SIDS.
                    While the model showed promising results in validation, the
                    project emphasized the importance of responsible AI
                    development in healthcare contexts.
                  </p>
                  <p className="text-lg">
                    This work contributes to the growing field of AI-assisted
                    healthcare diagnostics and highlights the intersection of
                    technology, medicine, and human experience: the impact of
                    predictive healthcare for SIDS, especially those tasked in
                    identifying critical early warning signals to improve their
                    intervention strategies, extends to real-time health
                    monitoring systems that could be implemented in neonatal
                    care units or even by family members through a user-friendly
                    application.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Future Directions
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-lg">
                    <li>Integration with electronic health record systems</li>
                    <li>Real-time monitoring and alert systems</li>
                    <li>Collaboration with pediatric healthcare providers</li>
                    <li>
                      Extension to other critical, yet humanly unexplainable
                      health conditions
                    </li>
                    <li>
                      Development of interpretable AI models for medical
                      professionals
                    </li>
                  </ul>
                </section>

                <div className="text-center mt-12 p-6 bg-primary/10 rounded-lg">
                  <p className="text-lg mb-4">
                    For more details about this project and its personal
                    journey, read the full story:
                  </p>
                  <a
                    href="#/blog/automating-healthcare-diagnostics"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Read Full Story
                  </a>
                </div>
                <h2 className="text-center text-3xl font-semibold mb-4">
                  T-VAD: Telemonitoring Ventricular Assist Device
                </h2>
                <div className="flex justify-center">
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink="https://www.instagram.com/p/CV5_oPLl6qX"
                    data-instgrm-version="14"
                    data-instgrm-captioned="true"
                    style={{
                      background: "#FFF",
                      border: 0,
                      margin: "1px",
                      maxWidth: "540px",
                      width: "100%",
                      padding: 0,
                      boxShadow:
                        "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
                    }}
                  ></blockquote>
                </div>
                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">
                    Project Overview
                  </h3>
                  <p className="text-lg mb-4">
                    This project involved developing a telemonitoring system for
                    a Left Ventricular Assist Device (LVAD), designed to monitor
                    cardiac function in patients with heart failure. By
                    integrating physiological sensor data and applying machine
                    learning techniques to predict device responsiveness, we
                    analyzed the system to reduce latency by an average of 13%,
                    improving patient outcomes through more responsive
                    monitoring. The potential impact of this work lies in the
                    enhancement of remote patient monitoring for cardiovascular
                    healthcare, particularly for individuals who rely on LVADs
                    for long-term heart support.
                  </p>
                  <p className="text-lg">
                    Below are the project presentations for this Biomedical
                    Engineering Capstone in chronological order:
                  </p>
                </section>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Pre-Phase A
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/LAiEM5dcUKQ?si=_8z4ynJm0qoGdwf8"
                  title="Pre-Phase A Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase A
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/OLhn2xjemEI?si=NdZTr5b1wGWUCUxB"
                  title="Phase A Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase B
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/YHeizMHLHy4?si=lv4ezvPjE24HT_3v"
                  title="Phase B Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase C1
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/gd1EXRHfgAs?si=jBV8hRVz6COwGQ1v"
                  title="Phase C1 Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase C2
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/4Kzy3jC9wH8?si=dvmoFOJk5TPcbTNc"
                  title="Phase C2 Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase D
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/bH2-uuVXT0A?si=KsIX8qPrjYvY4kvL"
                  title="Phase D Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Telemonitoring Ventricular Assist Device (TVAD) – Phase F
                  (Capstone II Phase F)
                </h3>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/pPrWRE6ptm4?si=B4450kjy4I5DxNZT"
                  title="Phase F Presentation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Capstone;
