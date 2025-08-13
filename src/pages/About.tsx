import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">About Me</h1>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-semibold mb-4">Carlos Francisco González Rivera, M.E.C.E., B.S.B.M.E.</h2>
                <p className="text-xl text-muted-foreground">Neuroengineer || Data Scientist || Private Thoughts ||</p>
              </div>
              <div className="prose prose-lg mx-auto">
                <p className="text-lg mb-6">
                  Carlos Francisco González Rivera is a dynamic and versatile Data Scientist and Biomedical Engineer whose work bridges the cutting edges of healthcare innovation, national security, neuromorphic computing, and artificial intelligence. With a solid foundation in developing machine learning models, anomaly detection systems, and computational tools, Carlos has a proven track record in both startup environments and large-scale research organizations. 
                {/* </p>
                <p className="text-lg mb-6"> */}
                  His expertise spans from biomedical device innovation to data-driven solutions that enhance human performance and national security infrastructure.
                </p>
                <h3 className="text-2xl font-semibold mt-8 mb-4">Career Highlights & Contributions</h3>
                <ul className="list-disc list-inside mb-6">
                  <li><strong>Real‑time Learning with Neuromorphic Systems:</strong> Collaborated with Intel, LANL, and Drexel University to develop Spiking Neural Networks (SNNs) for real-time data processing using Intel’s Loihi neuromorphic chip, resulting in adaptive ML models published in ICONS 2022.</li>
                  <li><strong>Persistent DyNAMICS:</strong> Designed and implemented unsupervised ML models for anomaly detection in nuclear facility monitoring systems—leveraging SHAP, LIME, and timestamp rolling—presented at the 2023 INMM & ESARDA Joint Annual Meeting.</li>
                  <li><strong>Image Processing for Synthetic Biology:</strong> Developed image segmentation techniques using OpenCV, DINO, SAM, Grounding DINO, and Grounded-SAM to analyze microbial images for PNNL’s PerCon SFA Project.</li>
                </ul>
                <h3 className="text-2xl font-semibold mt-8 mb-4">Education</h3>
                <ul className="list-disc list-inside mb-6">
                  <li><strong>M.E.C.E.</strong> - Master of Engineering in Electrical and Computer Engineering, Rice University</li>
                  <li><strong>B.S.B.M.E.</strong> - Bachelor of Science in Biomedical Engineering, Polytechnic University of Puerto Rico</li>
                </ul>
                <h3 className="text-2xl font-semibold mt-8 mb-4">Technical Skills</h3>
                <ul className="list-disc list-inside mb-6">
                  <li>Machine Learning & AI: PyTorch, TensorFlow, Scikit-learn</li>
                  <li>Neuromorphic Computing & SNNs: Intel Loihi, LCAs, DVS</li>
                  <li>Data Science & Feature Engineering: SHAP, LIME, anomaly detection</li>
                  <li>Computer Vision: OpenCV, DINO, Grounding DINO, SAM</li>
                  <li>Signal Processing: FFT, wavelets, time-series analysis</li>
                  <li>Data Handling: Pandas, NumPy, SciPy, HEOM</li>
                  <li>Development Tools: Git, Docker, Jupyter, DVC</li>
                </ul>
                <h3 className="text-2xl font-semibold mt-8 mb-4">Teaching & Leadership</h3>
                <ul className="list-disc list-inside mb-6">
                  <li>Taught “Python for Data Science” through PNNL’s BOLTS program</li>
                  <li>Lead TA for the Python tutorials and office hours in Rice’s “Introduction to Neuroengineering” course</li>
                  <li>Rice University TA, Software Lead for Neurotech@Rice, and sponsor for Rice’s D2K Lab Hackathon</li>
                </ul>
                <h3 className="text-2xl font-semibold mt-8 mb-4">Future Research Interests</h3>
                <p className="text-lg">
                  Carlos is driven by predictive modeling’s potential in early detection of physiological abnormalities, neuromorphic computing’s role in real-time adaptive systems, and integrating biomimicry, advanced sensors, and neuromorphic processors to advance human‑machine interfaces, digital healthcare, and national security.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
