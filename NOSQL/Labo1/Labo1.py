import xml.etree.ElementTree as ET
import xmlschema as xs

def get_root(xml_file):
    tree = ET.parse(xml_file)
    return tree.getroot()

def print_books_titles(xml_file):
    root = get_root(xml_file)
    print("\nListe des livres :")
    for book in root.findall('book'):
        title = book.find('title').text
        author = book.find('author').text
        year = book.find('year').text
        print(f"- {title} ({author}, {year})")

def indent(elem, level=0):
    i = "\n" + level*"  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        for e in elem:
            indent(e, level+1)
        if not e.tail or not e.tail.strip():
            e.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i

def add_book(xml_file, title, author, year):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    ids = [int(book.get('id')[2:]) for book in root.findall('book') if book.get('id', '').startswith('bk')]
    next_id = max(ids) + 1 if ids else 1
    new_id = f"bk{next_id:03d}"
    new_book = ET.Element('book', id=new_id)
    ET.SubElement(new_book, 'title').text = title
    ET.SubElement(new_book, 'author').text = author
    ET.SubElement(new_book, 'year').text = str(year)
    root.append(new_book)
    indent(root)
    tree.write(xml_file, encoding='utf-8', xml_declaration=True)

def validate_xml(xml_file, xsd_file):
    schema = xs.XMLSchema(xsd_file)
    return schema.is_valid(xml_file)
def modify_book(xml_file, book_id, new_title=None, new_author=None, new_year=None):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    book = root.find(f".//book[@id='{book_id}']")
    if book is None:
        print("Livre non trouvé.")
        return
    if new_title:
        book.find('title').text = new_title
    if new_author:
        book.find('author').text = new_author
    if new_year:
        book.find('year').text = str(new_year)
    indent(root)
    tree.write(xml_file, encoding='utf-8', xml_declaration=True)
    print("Livre modifié.")

def remove_book(xml_file, book_id):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    book = root.find(f".//book[@id='{book_id}']")
    if book is None:
        print("Livre non trouvé.")
        return
    root.remove(book)
    indent(root)
    tree.write(xml_file, encoding='utf-8', xml_declaration=True)
    print("Livre supprimé.")

def main():
    xml_file = 'Labo1/books.xml'
    xsd_file = 'Labo1/books.xsd'
    while True:
        print("\nMenu :")
        print("1. Afficher tous les livres")
        print("2. Ajouter un nouveau livre")
        print("3. Modifier un livre existant")
        print("4. Supprimer un livre")
        print("5. Quitter")
        choix = input("Votre choix : ")
        if choix == "1":
            print_books_titles(xml_file)
        elif choix == "2":
            title = input("Titre : ")
            author = input("Auteur : ")
            year = input("Année : ")
            add_book(xml_file, title, author, year)
            if validate_xml(xml_file, xsd_file):
                print("Livre ajouté et XML valide !")
            else:
                print("Erreur : le fichier XML n'est pas valide selon le schéma XSD.")
        elif choix == "3":
            book_id = input("ID du livre à modifier (ex: bk005) : ")
            title = input("Nouveau titre (laisser vide pour ne pas changer) : ")
            author = input("Nouvel auteur (laisser vide pour ne pas changer) : ")
            year = input("Nouvelle année (laisser vide pour ne pas changer) : ")
            modify_book(
                xml_file,
                book_id,
                new_title=title if title else None,
                new_author=author if author else None,
                new_year=year if year else None
            )
            if validate_xml(xml_file, xsd_file):
                print("Modification réussie et XML valide !")
            else:
                print("Erreur : le fichier XML n'est pas valide selon le schéma XSD.")
        elif choix == "4":
            book_id = input("ID du livre à supprimer (ex: bk005) : ")
            remove_book(xml_file, book_id)
            if validate_xml(xml_file, xsd_file):
                print("Suppression réussie et XML valide !")
            else:
                print("Erreur : le fichier XML n'est pas valide selon le schéma XSD.")
        elif choix == "5":
            print("Au revoir !")
            break
        else:
            print("Choix invalide.")
if __name__ == "__main__":
    main()