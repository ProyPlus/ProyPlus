package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.Address;
import com.example.gestor_inversores.model.enums.Province;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddressDTO {

    @NotBlank(message = "La calle no puede estar vacía")
    private String street;

    @Positive(message = "El número debe ser positivo")
    private int number;

    @NotBlank(message = "La ciudad no puede estar vacía")
    private String city;

    @NotNull(message = "La provincia es obligatoria")
    private String province;

    @Positive(message = "El código postal debe ser positivo")
    private int postalCode;

    public Address toEntity() {
        Address address = new Address();
        address.setStreet(this.street);
        address.setNumber(this.number);
        address.setCity(this.city);
        if (this.province != null) {
            address.setProvince(Province.valueOf(this.province));
        }
        address.setPostalCode(this.postalCode);
        return address;
    }

    public static AddressDTO fromEntity(Address address) {
        if (address == null) return null;

        AddressDTO dto = new AddressDTO();
        dto.setStreet(address.getStreet());
        dto.setNumber(address.getNumber());
        dto.setCity(address.getCity());
        dto.setProvince(address.getProvince() != null ? address.getProvince().name() : null);
        dto.setPostalCode(address.getPostalCode());

        return dto;
    }

}
