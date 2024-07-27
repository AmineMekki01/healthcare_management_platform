from PyPDF2 import PdfWriter, PdfReader

def extract_selected_pages_to_single_pdf(
    input_file_path, output_file_path, pages_to_extract
):
    """
    Extracts selected pages from an input PDF file and saves them as a new PDF file.

    Args:
        input_file_path (str): The path to the input PDF file.
        output_file_path (str): The path to save the output PDF file.
        pages_to_extract (list): A list of page numbers to extract. Pages are 1-based.

    Returns:
        None
    """
    input_pdf = PdfReader(input_file_path)
    output_pdf = PdfWriter()
    for page_number in pages_to_extract:
        output_pdf.add_page(input_pdf.pages[page_number - 1])
    with open(output_file_path, "wb") as output_pdf_file:
        output_pdf.write(output_pdf_file)
