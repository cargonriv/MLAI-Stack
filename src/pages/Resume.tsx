import Header from "@/components/Header";

const Resume = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">Resume</h1>
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Carlos F. González Rivera</h2>
                <p className="text-xl text-muted-foreground mb-4">M.E.C.E., B.S.B.M.E.</p>
                <p className="text-lg">Neuroengineer | Data Scientist | Computer Vision Researcher</p>
                <div className="flex justify-center gap-4 mt-4">
                  <a href="mailto:cargonriv@pm.me" className="text-primary hover:text-primary/80">cargonriv@pm.me</a>
                  <a href="https://linkedin.com/in/cargonriv" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">LinkedIn</a>
                  <a href="https://github.com/cargonriv" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">GitHub</a>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Education</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold">Master of Engineering in Computer Engineering (M.E.C.E.)</h4>
                      <p className="text-muted-foreground">Rice University | Expected 2024</p>
                      <p className="mt-2">Focus: Machine Learning, Computer Vision, Neuroengineering</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Bachelor of Science in Biomedical Engineering (B.S.B.M.E.)</h4>
                      <p className="text-muted-foreground">University Institution</p>
                      <p className="mt-2">Foundation in engineering principles with focus on healthcare applications</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Experience</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold">Data Scientist</h4>
                      <p className="text-muted-foreground">Research Laboratory | 2024 - Present</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Developed machine learning models for healthcare diagnostics</li>
                        <li>Implemented computer vision solutions for medical imaging</li>
                        <li>Researched applications of neural networks in neuroengineering</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Machine Learning Engineer</h4>
                      <p className="text-muted-foreground">Graduate Research | 2023 - 2024</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Designed and implemented deep learning architectures</li>
                        <li>Conducted research on Locally Competitive Algorithms (LCAs)</li>
                        <li>Published research on neural network applications</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Technical Skills</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Programming Languages</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python</li>
                        <li>MATLAB</li>
                        <li>R</li>
                        <li>JavaScript</li>
                        <li>SQL</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Frameworks & Tools</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>TensorFlow, PyTorch</li>
                        <li>OpenCV, scikit-learn</li>
                        <li>Pandas, NumPy</li>
                        <li>Docker, Git</li>
                        <li>AWS, GCP</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Research Interests</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Computer Vision in Healthcare</li>
                    <li>Neural Network Architectures</li>
                    <li>Biomedical Signal Processing</li>
                    <li>Machine Learning for Diagnostics</li>
                    <li>Neuroengineering Applications</li>
                  </ul>
                </section>

                <div className="text-center mt-12">
                  <p className="text-muted-foreground">
                    For a detailed PDF version of my resume, please{" "}
                    <a 
                      href="mailto:cargonriv@pm.me" 
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      contact me
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resume;