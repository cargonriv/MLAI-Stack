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
                <h2 className="text-3xl font-bold mb-2">
                  Carlos F. González Rivera
                </h2>
                <p className="text-xl text-muted-foreground mb-4">
                  M.E.C.E., B.S.B.M.E.
                </p>
                {/* <p className="text-lg">Neuroengineer | Data Scientist | Computer Vision Researcher</p> */}
                <div className="flex justify-center gap-4 mt-4">
                  <a
                    href="mailto:cargonriv@pm.me"
                    className="text-primary hover:text-primary/80"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
                      alt="Email"
                      className="w-12 h-12 hover:opacity-80"
                    />
                  </a>
                  <a
                    href="https://linkedin.com/in/cargonriv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                      alt="LinkedIn"
                      className="w-12 h-12 hover:opacity-80"
                    />
                  </a>
                  <a
                    href="https://github.com/cargonriv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <img
                      src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                      alt="GitHub"
                      className="w-12 h-12 hover:opacity-80"
                    />
                  </a>
                  <a
                    href="https://www.instagram.com/cargonriv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                      alt="Instagram"
                      className="w-12 h-12 hover:opacity-80"
                    />
                  </a>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">
                    Education
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold">
                        Master of Electrical and Computer Engineering (M.E.C.E.)
                      </h4>
                      <p className="text-muted-foreground">
                        Rice University | GPA: 3.77/4.00, May 2025
                      </p>
                      <p className="mt-2">
                        Focus: Data Science, Advanced Machine Learning, Computer
                        Vision, Digital Health, Neuroengineering
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">
                        Bachelor of Science in Biomedical Engineering
                        (B.S.B.M.E.)
                      </h4>
                      <p className="text-muted-foreground">
                        Polytechnic University of Puerto Rico | GPA: 3.88/4.00,
                        September 2021
                      </p>
                      {/* <p className="mt-2">Foundation in engineering principles with focus on healthcare applications</p> */}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">
                    Experience
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold">Data Scientist</h4>
                      <p className="text-muted-foreground">
                        Pacific Northwest National Laboratory | June 2021 -
                        Present
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>
                          Conducted research on Locally Competitive Algorithms
                          (LCAs)
                        </li>
                        <li>
                          Implemented computer vision solutions for microbial
                          experiments
                        </li>
                        <li>
                          Researched applications of neural networks in
                          neuroengineering applications
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">
                        Machine Learning Engineer
                      </h4>
                      <p className="text-muted-foreground">
                        Graduate Research | Jaunary 2024 - May 2025
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>
                          Designed and implemented deep learning architectures
                        </li>
                        <li>
                          Implemented computer vision solutions for medical
                          imaging
                        </li>
                        <li>
                          Developed machine learning models for healthcare
                          diagnostics
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">
                    Technical Skills
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Programming Languages
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python</li>
                        <li>R</li>
                        <li>SQL</li>
                        <li>NoSQL</li>
                        <li>Shell</li>
                        <li>JavaScript/TypeScript</li>
                        <li>HTML/CSS</li>
                        <li>PHP</li>
                        <li>C++</li>
                        <li>MATLAB</li>
                        <li>Solidity</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Frameworks & Tools
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                      <li>PyTorch, TorchVision, TorchAudio, TensorFlow, Keras</li>
                      <li>HuggingFace, LangChain, SAM, CLIP, GLIP, Grounding DINO</li>

                      <li>scikit-learn, scikit-image, OpenCV, ONNX</li>
                      <li>Pandas, NumPy, SciPy, PyWavelets, NeuroKit2, PyDICOM</li>

                      <li>Jupyter, Matplotlib, Seaborn, Plotly</li>

                      <li>FastAPI, Django, Flask, Requests, BeautifulSoup</li>
                      <li>React, Next.js, Vite, Express.js</li>
                      <li>p5.js, paper.js, D3.js</li>

                      <li>MySQL, PostgreSQL, MongoDB, Mongoose</li>
                      <li>Supabase, Firebase</li>

                      <li>Docker, Git, SSH, SLURM</li>
                      <li>PyLint, Flake8, Black, isort, mypy</li>

                        {/* <li>Tableau, PowerBI</li> */}
                        {/* <li>AWS, GCP</li> */}
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-4 border-b pb-2">
                    Favorite Research Interests
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Computer Vision in Healthcare</li>
                    <li>Explainable AI (XAI)</li>
                    <li>Biomedical Signal Processing</li>
                    <li>Full-Stack Development</li>
                    <li>Brain-Computer Interfaces (BCIs)</li>
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
