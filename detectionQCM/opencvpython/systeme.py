import os
import ghostscript
from pdf2image import convert_from_path


def pdf2jpeg(pdf_input_path, jpeg_output_path):
    args = ["pdf2jpeg", # actual value doesn't matter
            "-dNOPAUSE",
            "-sDEVICE=jpeg",
            "-r144",
            "-sOutputFile=" + jpeg_output_path,
            pdf_input_path]
    ghostscript.Ghostscript(*args)

def pdf2png(pdf_input_path, png_output_path):
    pages = convert_from_path(pdf_input_path, 500)
    for page in pages:
        page.save(png_output_path, 'PNG')


def effaceFichiers(dir : str):
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))