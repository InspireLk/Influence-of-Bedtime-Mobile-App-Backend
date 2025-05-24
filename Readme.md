Create sleep_env

Go to this file location in terminal ----> /ML/BedtimePredict (for mac open bash terminal)
put this command ----> python3 -m venv sleep_env

Now it should display like this

ML/BedtimePredict/sleep_env/
├── bin/
├── lib/
├── include/
└── pyvenv.cfg

Activate the virtual environment

On Linux/macOS  -----> source sleep_env/bin/activate

On Windows (CMD) -----> sleep_env\Scripts\activate


After activate sleep_env execute these

pip install pandas joblib
pip install xgboost


Pyhon intepretter path
     for mac inside  BedtimePredictController/predictBedtime() function

        const pythonInterpreterPath = path.join(
        __dirname, 
        "..", 
        "ML", 
        "BedtimePredict", 
        "sleep_env",
        "bin",
        "python3",
        );

    for windows inside  BedtimePredictController/predictBedtime() function
        
        const pythonInterpreterPath = path.join(
            __dirname, 
            "..", 
            "ML", 
            "BedtimePredict", 
            "sleep_env",
            "Scripts",
            "python.exe"
            );





