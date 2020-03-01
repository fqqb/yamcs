package org.yamcs.http.api;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.List;
import java.util.Map.Entry;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.yamcs.logging.Log;
import org.yamcs.xtce.AggregateParameterType;
import org.yamcs.xtce.BooleanParameterType;
import org.yamcs.xtce.DataEncoding;
import org.yamcs.xtce.EnumeratedParameterType;
import org.yamcs.xtce.FloatDataEncoding;
import org.yamcs.xtce.FloatParameterType;
import org.yamcs.xtce.FloatValidRange;
import org.yamcs.xtce.Header;
import org.yamcs.xtce.History;
import org.yamcs.xtce.IntegerDataEncoding;
import org.yamcs.xtce.IntegerParameterType;
import org.yamcs.xtce.IntegerValidRange;
import org.yamcs.xtce.Member;
import org.yamcs.xtce.MetaCommand;
import org.yamcs.xtce.NameDescription;
import org.yamcs.xtce.Parameter;
import org.yamcs.xtce.ParameterType;
import org.yamcs.xtce.SpaceSystem;
import org.yamcs.xtce.StringDataEncoding;
import org.yamcs.xtce.StringParameterType;
import org.yamcs.xtce.UnitType;
import org.yamcs.xtce.ValueEnumeration;

public class XtceAssembler {

    private static final String NS_XTCE_V1_1 = "http://www.omg.org/space/xtce";
    private static final Log log = new Log(XtceAssembler.class);

    public static final String toXtce(SpaceSystem spaceSystem) {
        try {
            String unindentedXML;
            try (Writer writer = new StringWriter()) {
                XMLOutputFactory factory = XMLOutputFactory.newInstance();
                XMLStreamWriter xmlWriter = factory.createXMLStreamWriter(writer);
                xmlWriter.writeStartDocument();

                writeSpaceSystem(xmlWriter, spaceSystem, true);
                xmlWriter.writeEndDocument();
                xmlWriter.close();
                unindentedXML = writer.toString();
            }

            try (Reader reader = new StringReader(unindentedXML); Writer writer = new StringWriter()) {
                TransformerFactory transformerFactory = TransformerFactory.newInstance();
                Transformer transformer = transformerFactory.newTransformer();
                transformer.setOutputProperty(OutputKeys.INDENT, "yes");
                transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

                StreamSource source = new StreamSource(reader);
                StreamResult result = new StreamResult(writer);
                transformer.transform(source, result);
                return writer.toString();
            }
        } catch (IOException | XMLStreamException | TransformerException e) {
            throw new Error(e);
        }
    }

    private static void writeSpaceSystem(XMLStreamWriter doc, SpaceSystem spaceSystem, boolean emitNamespace)
            throws XMLStreamException {
        doc.writeStartElement("SpaceSystem");
        if (emitNamespace) {
            doc.writeDefaultNamespace(NS_XTCE_V1_1);
        }
        writeNameDescription(doc, spaceSystem);

        Header header = spaceSystem.getHeader();
        if (header != null) {
            writeHeader(doc, header);
        }

        doc.writeStartElement("TelemetryMetaData");
        if (!spaceSystem.getParameterTypes().isEmpty()) {
            doc.writeStartElement("ParameterTypeSet");
            for (ParameterType ptype : spaceSystem.getParameterTypes()) {
                writeParameterType(doc, ptype);
            }
            doc.writeEndElement();
        }
        if (!spaceSystem.getParameters().isEmpty()) {
            doc.writeStartElement("ParameterSet");
            for (Parameter parameter : spaceSystem.getParameters()) {
                writeParameter(doc, parameter);
            }
            doc.writeEndElement();
        }
        doc.writeEndElement();

        if (!spaceSystem.getMetaCommands().isEmpty()) {
            doc.writeStartElement("CommandMetaData");
            doc.writeStartElement("MetaCommandSet");
            for (MetaCommand command : spaceSystem.getMetaCommands()) {
                writeCommand(doc, command);
            }
            doc.writeEndElement();
            doc.writeEndElement();
        }

        for (SpaceSystem sub : spaceSystem.getSubSystems()) {
            writeSpaceSystem(doc, sub, false);
        }

        doc.writeEndElement();
    }

    private static void writeHeader(XMLStreamWriter doc, Header header) throws XMLStreamException {
        doc.writeStartElement("Header");
        doc.writeAttribute("validationStatus", "Unknown"); // Required attribute
        if (header.getVersion() != null) {
            doc.writeAttribute("version", header.getVersion());
        }
        if (header.getDate() != null) {
            doc.writeAttribute("date", header.getDate());
        }
        if (!header.getHistoryList().isEmpty()) {
            doc.writeStartElement("HistorySet");
            for (History history : header.getHistoryList()) {
                doc.writeStartElement("History");
                if (history.getDate() != null && !history.getDate().isEmpty()) {
                    doc.writeCharacters(history.getDate());
                    doc.writeCharacters(": ");
                }
                doc.writeCharacters(history.getMessage());

                doc.writeEndElement();
            }
            doc.writeEndElement();
        }
        doc.writeEndElement();
    }

    private static void writeParameter(XMLStreamWriter doc, Parameter parameter) throws XMLStreamException {
        doc.writeStartElement("Parameter");

        ParameterType ptype = parameter.getParameterType();
        doc.writeAttribute("parameterTypeRef", ptype.getName()); // Required attribute

        writeNameDescription(doc, parameter);

        doc.writeEndElement();
    }

    private static void writeParameterType(XMLStreamWriter doc, ParameterType ptype) throws XMLStreamException {
        if (ptype instanceof StringParameterType) {
            writeStringParameterType(doc, (StringParameterType) ptype);
        } else if (ptype instanceof IntegerParameterType) {
            writeIntegerParameterType(doc, (IntegerParameterType) ptype);
        } else if (ptype instanceof AggregateParameterType) {
            writeAggregateParameterType(doc, (AggregateParameterType) ptype);
        } else if (ptype instanceof FloatParameterType) {
            writeFloatParameterType(doc, (FloatParameterType) ptype);
        } else if (ptype instanceof BooleanParameterType) {
            writeBooleanParameterType(doc, (BooleanParameterType) ptype);
        } else if (ptype instanceof EnumeratedParameterType) {
            writeEnumeratedParameterType(doc, (EnumeratedParameterType) ptype);
        } else {
            log.warn("Unexpected parameter type " + ptype.getClass());
        }
    }

    private static void writeEnumeratedParameterType(XMLStreamWriter doc, EnumeratedParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("EnumeratedParameterType");
        if (ptype.getInitialValue() != null) {
            doc.writeAttribute("initialValue", ptype.getInitialValue());
        }
        writeNameDescription(doc, ptype);

        doc.writeStartElement("EnumerationList");
        for (ValueEnumeration valueEnumeration : ptype.getValueEnumerationList()) {
            doc.writeStartElement("Enumeration");
            doc.writeAttribute("label", valueEnumeration.getLabel());
            doc.writeAttribute("value", Long.toString(valueEnumeration.getValue()));
            doc.writeEndElement();
        }
        doc.writeEndElement();

        writeUnitSet(doc, ptype.getUnitSet());

        DataEncoding encoding = ptype.getEncoding();
        writeDataEncoding(doc, encoding);

        doc.writeEndElement();
    }

    private static void writeAggregateParameterType(XMLStreamWriter doc, AggregateParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("AggregateParameterType");

        writeNameDescription(doc, ptype);

        doc.writeStartElement("MemberList");
        for (Member member : ptype.getMemberList()) {
            doc.writeStartElement("Member");
            doc.writeAttribute("name", member.getName());
            doc.writeAttribute("typeRef", member.getType().getName());
            doc.writeEndElement();
        }
        doc.writeEndElement();

        doc.writeEndElement();
    }

    private static void writeIntegerParameterType(XMLStreamWriter doc, IntegerParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("IntegerParameterType");
        doc.writeAttribute("sizeInBits", Integer.toString(ptype.getSizeInBits()));
        doc.writeAttribute("signed", "false");
        if (ptype.getInitialValue() != null) {
            doc.writeAttribute("initialValue", ptype.getInitialValue().toString());
        }
        writeNameDescription(doc, ptype);
        if (ptype.getValidRange() != null) {
            IntegerValidRange range = ptype.getValidRange();
            doc.writeStartElement("ValidRange");
            doc.writeAttribute("minInclusive", String.valueOf(range.getMinInclusive()));
            doc.writeAttribute("maxInclusive", String.valueOf(range.getMaxInclusive()));
            doc.writeEndElement();

            doc.writeAttribute("validRangeAppliesToCalibrated",
                    Boolean.toString(ptype.getValidRange().isValidRangeAppliesToCalibrated()));
        }
        writeUnitSet(doc, ptype.getUnitSet());

        DataEncoding encoding = ptype.getEncoding();
        writeDataEncoding(doc, encoding);

        doc.writeEndElement();
    }

    private static void writeFloatParameterType(XMLStreamWriter doc, FloatParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("FloatParameterType");
        doc.writeAttribute("sizeInBits", Integer.toString(ptype.getSizeInBits()));
        if (ptype.getInitialValue() != null) {
            doc.writeAttribute("initialValue", ptype.getInitialValue().toString());
        }
        writeNameDescription(doc, ptype);
        if (ptype.getValidRange() != null) {
            FloatValidRange range = ptype.getValidRange();
            doc.writeStartElement("ValidRange");
            if (range.isMinInclusive()) {
                doc.writeAttribute("minInclusive", String.valueOf(range.getMin()));
            } else {
                doc.writeAttribute("minExclusive", String.valueOf(range.getMin()));
            }
            if (range.isMaxInclusive()) {
                doc.writeAttribute("maxInclusive", String.valueOf(range.getMax()));
            } else {
                doc.writeAttribute("maxExclusive", String.valueOf(range.getMax()));
            }
            doc.writeEndElement();

            doc.writeAttribute("validRangeAppliesToCalibrated", "true");
        }
        writeUnitSet(doc, ptype.getUnitSet());

        DataEncoding encoding = ptype.getEncoding();
        writeDataEncoding(doc, encoding);

        doc.writeEndElement();
    }

    private static void writeBooleanParameterType(XMLStreamWriter doc, BooleanParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("BooleanParameterType");
        if (ptype.getInitialValue() != null) {
            if (ptype.getInitialValue()) {
                doc.writeAttribute("initialValue", ptype.getOneStringValue());
            } else {
                doc.writeAttribute("initialValue", ptype.getZeroStringValue());
            }
        }
        doc.writeAttribute("oneStringValue", ptype.getOneStringValue());
        doc.writeAttribute("zeroStringValue", ptype.getZeroStringValue());
        writeNameDescription(doc, ptype);
        writeUnitSet(doc, ptype.getUnitSet());

        DataEncoding encoding = ptype.getEncoding();
        writeDataEncoding(doc, encoding);

        doc.writeEndElement();
    }

    private static void writeDataEncoding(XMLStreamWriter doc, DataEncoding encoding) throws XMLStreamException {
        if (encoding instanceof IntegerDataEncoding) {
            writeIntegerDataEncoding(doc, (IntegerDataEncoding) encoding);
        } else if (encoding instanceof FloatDataEncoding) {
            writeFloatDataEncoding(doc, (FloatDataEncoding) encoding);
        } else if (encoding instanceof StringDataEncoding) {
            writeStringDataEncoding(doc, (StringDataEncoding) encoding);
        } else {
            log.warn("Unexpected data encoding " + encoding.getClass());
        }
    }

    private static void writeIntegerDataEncoding(XMLStreamWriter doc, IntegerDataEncoding encoding)
            throws XMLStreamException {
        doc.writeStartElement("IntegerDataEncoding");
        switch (encoding.getEncoding()) {
        case ONES_COMPLEMENT:
            doc.writeAttribute("encoding", "onesCompliment");
            break;
        case SIGN_MAGNITUDE:
            doc.writeAttribute("encoding", "signMagnitude");
            break;
        case TWOS_COMPLEMENT:
            doc.writeAttribute("encoding", "twosCompliment");
            break;
        case UNSIGNED:
            doc.writeAttribute("encoding", "unsigned");
            break;
        default:
            log.warn("Unexpected encoding " + encoding);
        }
        doc.writeAttribute("sizeInBits", Integer.toString(encoding.getSizeInBits()));
        doc.writeEndElement();
    }

    private static void writeFloatDataEncoding(XMLStreamWriter doc, FloatDataEncoding encoding)
            throws XMLStreamException {
        doc.writeStartElement("FloatDataEncoding");
        switch (encoding.getEncoding()) {
        case IEEE754_1985:
            doc.writeAttribute("encoding", "IEE754_1985");
            break;
        case MILSTD_1750A:
            doc.writeAttribute("encoding", "MILSTD_1750A");
            break;
        default:
            log.warn("Unexpected encoding " + encoding);
        }
        doc.writeAttribute("sizeInBits", Integer.toString(encoding.getSizeInBits()));
        doc.writeEndElement();
    }

    private static void writeStringDataEncoding(XMLStreamWriter doc, StringDataEncoding encoding)
            throws XMLStreamException {
        doc.writeStartElement("StringDataEncoding");
        doc.writeEndElement();
    }

    private static void writeStringParameterType(XMLStreamWriter doc, StringParameterType ptype)
            throws XMLStreamException {
        doc.writeStartElement("StringParameterType");
        writeNameDescription(doc, ptype);
        writeUnitSet(doc, ptype.getUnitSet());
        writeDataEncoding(doc, ptype.getEncoding());
        doc.writeEndElement();
    }

    private static void writeNameDescription(XMLStreamWriter doc, NameDescription nameDescription)
            throws XMLStreamException {
        doc.writeAttribute("name", nameDescription.getName());
        if (nameDescription.getShortDescription() != null) {
            doc.writeAttribute("shortDescription", nameDescription.getShortDescription());
        }
        if (nameDescription.getLongDescription() != null) {
            doc.writeStartElement("LongDescription");
            doc.writeCharacters(nameDescription.getLongDescription());
            doc.writeEndElement();
        }
        if (nameDescription.getAliasSet().size() > 0) {
            doc.writeStartElement("AliasSet");
            for (Entry<String, String> alias : nameDescription.getAliasSet().getAliases().entrySet()) {
                doc.writeStartElement("Alias");
                doc.writeAttribute("nameSpace", alias.getKey());
                doc.writeAttribute("alias", alias.getValue());
                doc.writeEndElement();
            }
            doc.writeEndElement();
        }
    }

    private static void writeUnitSet(XMLStreamWriter doc, List<UnitType> unitSet) throws XMLStreamException {
        doc.writeStartElement("UnitSet"); // Required
        for (UnitType unitType : unitSet) {
            doc.writeStartElement("Unit");
            if (unitType.getPower() != 1) {
                doc.writeAttribute("power", Double.toString(unitType.getPower()));
            }
            if (!unitType.getFactor().equals("1")) {
                doc.writeAttribute("factor", unitType.getFactor());
            }
            if (unitType.getDescription() != null) {
                doc.writeAttribute("description", unitType.getDescription());
            }
            doc.writeCharacters(unitType.getUnit());
            doc.writeEndElement();
        }
        doc.writeEndElement();
    }

    private static void writeCommand(XMLStreamWriter doc, MetaCommand command) throws XMLStreamException {
        doc.writeStartElement("MetaCommand");
        if (command.isAbstract()) {
            doc.writeAttribute("abstract", "true");
        }
        writeNameDescription(doc, command);
        doc.writeEndElement();
    }
}
