'use client'

import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { allStatesCases, allStatesSRR, federalCases, federalRule, federalSR, statesCases } from "@/config/LegalData";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";


interface ItemProps {
  id: string;
  value: string;
}

interface ToggleState {
  [name: string]: boolean;
}

interface CheckboxWithToggleProps {
  name: string;
  label: string;
  field: any; // Change to your specific type
  className?: string;
  toggle?: boolean;
}

interface CheckboxListProps {
  items: ItemProps[];
  form: any; // Change to your specific type
  name: string;
  headerName: string;
  subHeaderName: string;
  optionalHeaderName?: string;
}

interface CheckboxListWithToggleProps {
  form: any; // Change to your specific type
  mField: any; // Change to your specific type
  label: string;
  className?: string;
  name: string;
}



const LegalFilterModal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const FormSchema = z.object({
    items: z.array(z.string()).optional(),
    allData: z.boolean().default(false),
    allFederal: z.boolean().default(false),
    allFederalCases: z.boolean().default(false),
    allFederalCasesSelected: z.array(z.string()).optional(),
    allFederalSRR: z.boolean().default(false),
    allFederalSR: z.boolean().default(false),
    allFederalSRSelected: z.array(z.string()).optional(),
    allFederalRule: z.boolean().default(false),
    allFederalRuleSelected: z.array(z.string()).optional(),
    allState: z.boolean().default(false),
    allStateCases: z.boolean().default(false),
    allStateCasesSelected: z.array(z.string()).optional(),
    allStateSRR: z.boolean().default(false),
    allStateSRRStateSelected: z.array(z.string()).optional(),
    allStateSRRSelected: z.array(z.string()).optional(),

  });
  const [initialData, setInitialData] = useState<z.infer<typeof FormSchema> | null>(null);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData || {
      items: [],
    },
  });

  useEffect(() => {
    const storedData = localStorage.getItem('legalFilterData');
    if (storedData) {
      const data = JSON.parse(storedData) as z.infer<typeof FormSchema>;
      setInitialData(data);
      form.reset(data);
    }
  }, [form]);

  const toggleCheckbox = (name: string) => {
    setToggleState(prevState => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  };

  const CheckboxWithToggle = ({ name, label, field, className, toggle = true }: CheckboxWithToggleProps) => (
    <FormItem className={cn("flex flex-row items-center space-x-3", className)}>
      <Checkbox checked={field.value == true} onCheckedChange={(checked) =>
        field.onChange(checked ? true : false)
      } />
      <FormLabel className="text-sm font-normal w-full">{label}</FormLabel>
      {toggle && <div className="w-full h-full" onClick={() => toggleCheckbox(name)}>
        <Image
          alt="allFederalToggle"
          src={toggleState[name] ? `/openIcon.svg` : `/closeIcon.svg`}
          width={10}
          height={10}
        />
      </div>}
      <FormMessage />
    </FormItem>
  );

  function onSubmit(data: z.infer<typeof FormSchema>) {
    localStorage.setItem('legalFilterData', JSON.stringify(data, null, 2))
    setIsOpen(false)
  }

  const CheckboxList = ({ items, form, name, headerName, subHeaderName, optionalHeaderName }: CheckboxListProps) => (
    <FormItem>
      {items.map((item) => (
        <FormField
          key={item.id}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem
              key={item.id}
              className="ml-6 flex flex-row items-start space-x-3 space-y-0"
            >
              <Checkbox
                checked={field.value?.includes(item.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const updatedValues = field.value ? [...field.value, item.value] : [item.value];
                    field.onChange(updatedValues);
                    if (checked && form.getValues('allData')) {
                      form.setValue('allData', false);
                    }
                    form.setValue(subHeaderName, false);

                    form.setValue(headerName, false);
                    form.setValue(optionalHeaderName, false);


                  } else {
                    const filteredValues = field.value?.filter((value: string) => value !== item.value);
                    field.onChange(filteredValues);
                  }
                }}
              />

              <FormLabel className="text-sm font-normal w-full">
                {item.value}
              </FormLabel>
            </FormItem>
          )}
        />
      ))}
      <FormMessage />
    </FormItem>
  );

  const CheckboxListWithToggle = ({ form, mField, label, className, name }: CheckboxListWithToggleProps) => {
    const [isToggle, setIsToggle] = useState(false);


    return (
      <>
        <FormItem className={cn("flex flex-row items-center space-x-3", className)}>
          <Checkbox
            checked={mField.value?.includes(name)}
            onCheckedChange={(checked) => {


              if (checked) {
                const updatedValues = mField.value ? [...mField.value, name] : [name];
                mField.onChange(updatedValues)

                if (checked && form.getValues('allData')) {
                  form.setValue('allState', false);
                  form.setValue('allStateSRR', false);

                }
                form.setValue('allState', false);
                form.setValue('allStateSRR', false);
                if (form.getValues('allStateSRRSelected') && form.getValues('allStateSRRSelected').length > 0) {
                  const updatedValuesallStateSRRValue = form.getValues('allStateSRRSelected')
                  const filteredValues = updatedValuesallStateSRRValue.filter((value: string) => {
                    if (allStatesSRR[label as keyof typeof allStatesSRR] && allStatesSRR[label as keyof typeof allStatesSRR].some(item => item.value === value)) {
                      return false;
                    } else {
                      return true;
                    }
                  });
                  form.setValue('allStateSRRSelected', filteredValues)
                }
              } else {
                const filteredValues = mField.value?.filter((value: string) => value !== name);
                mField.onChange(filteredValues);
              }
            }}
          />
          <FormLabel className="text-sm font-normal w-[175px]">{label}</FormLabel>
          <div className="w-full h-full" onClick={() => setIsToggle(!isToggle)}>
            <Image
              alt="allFederalToggle"
              src={isToggle ? `/openIcon.svg` : `/closeIcon.svg`}
              width={10}
              height={10}
            />
          </div>
          <FormMessage />
        </FormItem>

        {isToggle && (
          <FormItem>
            {label && allStatesSRR[label as keyof typeof allStatesSRR].map((item: ItemProps) => (
              <FormField
                key={item.id}
                control={form.control}
                name={"allStateSRRSelected"}
                render={({ field }) => (
                  <FormItem
                    key={item.id}
                    className="ml-7 flex flex-row items-start space-x-3 space-y-0"
                  >
                    <Checkbox
                      checked={field.value?.includes(item.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const updatedValues = field.value ? [...field.value, item.value] : [item.value];
                          field.onChange(updatedValues);
                          form.setValue('allState', false);
                          form.setValue('allStateSRR', false);
                          if (form && form.getValues('allStateSRRStateSelected')) {
                            const updatedValues = form.getValues('allStateSRRStateSelected');
                            const filteredValues = updatedValues.filter((value: string) => value !== name);

                            form.setValue('allStateSRRStateSelected', filteredValues ? filteredValues : []);
                          }

                        } else {
                          const filteredValues = field.value?.filter((value: string) => value !== item.value);
                          field.onChange(filteredValues);
                        }
                      }}
                    />
                    <FormLabel className="text-sm font-normal ">
                      {item.value}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      </>
    );
  }

  const [toggleState, setToggleState] = useState<ToggleState>({
    allData: false,
    allFederal: false,
    allFederalCases: false,
    allFederalSR: false,
    allFederalSRR: false,
    allFederalRule: false,
    allState: false,
    allStateCases: false,
    allStateSRR: false
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v)
        }
      }}>
      <DialogTrigger
        onClick={() => setIsOpen(true)}
        asChild>
        <Button> Select Legal Data Filters</Button>
      </DialogTrigger>

      <DialogContent className="max-w-[60vw] h-[80vh] overflow-y-auto">
        <main className="m-4 ">
          <div className=" flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
            <div className="flex gap-2">
              <Image
                alt="FilterImg"
                src="/FiltericonOnly.svg"
                width={2.5}
                height={2.5}
                className="w-10 h-10  font-bold"
              /> <h3 className="mb-3 font-bold text-3xl text-gray-900">
                Legal Data Filters
              </h3>
            </div>
          </div>

          {/* display all user files */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 mt-2">
              <FormField
                control={form.control}
                name="allData"
                render={({ field }) => (
                  <CheckboxWithToggle field={{
                    ...field,
                    onChange: (checked: boolean) => {
                      if (checked && form.getValues('allFederal') || form.getValues('allState')) {
                        form.setValue('allFederal', false);
                        form.setValue('allState', false);
                      }
                      field.onChange(checked);
                    }
                  }} name={'allData'} label={'Select All Federal and State Cases, Statutes, Codes, and Regulations'} className={''} toggle={false} />
                )}
              />
              <p className="tex-md">OR</p>
              <FormField
                control={form.control}
                name="allFederal"
                render={({ field }) => (
                  <CheckboxWithToggle
                    label={'All Federal'}
                    name={'allFederal'}
                    field={{
                      ...field,
                      onChange: (checked: boolean) => {
                        if (checked) {
                          if (checked && form.getValues('allData')) {
                            form.setValue('allData', false);


                          }
                          form.setValue('allFederalCases', false);
                          form.setValue('allFederalSRR', false);
                          form.setValue('allFederalSR', false);
                          form.setValue('allFederalRule', false);
                          form.setValue('allFederalCasesSelected', []);
                          form.setValue('allFederalSRSelected', []);
                          form.setValue('allFederalRuleSelected', []);
                        }
                        field.onChange(checked);
                      }
                    }}
                    className={''}
                  />
                )}
              />
              {toggleState['allFederal'] &&
                <>
                  <FormField
                    control={form.control}
                    name="allFederalCases"
                    render={({ field }) => (
                      <CheckboxWithToggle className={'ml-3'} label={'All Federal Cases'} name={"allFederalCases"} field={{
                        ...field,
                        onChange: (checked: boolean) => {
                          if (checked) {
                            if (checked && form.getValues('allData')) {
                              form.setValue('allData', false);


                            }
                            form.setValue('allFederal', false);
                            form.setValue('allFederalCases', false);
                            form.setValue('allFederalCasesSelected', []);
                          }
                          field.onChange(checked);
                        }
                      }} />

                    )}
                  />
                  {toggleState['allFederalCases'] && (
                    <FormField
                      control={form.control}
                      name="allFederalCasesSelected"
                      render={() => (
                        <CheckboxList
                          items={federalCases}
                          form={form}
                          name="allFederalCasesSelected"
                          subHeaderName={"allFederalCases"}
                          headerName={"allFederal"}
                        />
                      )}
                    />
                  )}
                  {toggleState['allFederal'] && <FormField
                    control={form.control}
                    name="allFederalSRR"
                    render={({ field }) => (
                      <CheckboxWithToggle name={'allFederalSRR'} label={'All Federal Statutes, Regulations, and Rules'} className={'ml-3'}
                        field={{
                          ...field,
                          onChange: (checked: boolean) => {
                            if (checked) {
                              if (checked && form.getValues('allData')) {
                                form.setValue('allData', false);



                              }
                              form.setValue('allFederal', false);
                              form.setValue('allFederalSR', false);
                              form.setValue('allFederalRule', false);


                              form.setValue('allFederalRuleSelected', []);

                              form.setValue('allFederalSRSelected', []);
                            }
                            field.onChange(checked);
                          }
                        }}

                      />
                    )}
                  />}

                  {toggleState['allFederalSRR'] && (
                    <>
                      <FormField
                        control={form.control}
                        name="allFederalSR"
                        render={({ field }) => (
                          <CheckboxWithToggle name={'allFederalSR'} label={'Statutes and Regulations'} className={'ml-5'} field={{
                            ...field,
                            onChange: (checked: boolean) => {
                              if (checked) {
                                if (checked && form.getValues('allData')) {
                                  form.setValue('allData', false);
                                }
                                form.setValue('allFederal', false);
                                form.setValue('allFederalSR', false);

                                form.setValue('allFederalSRSelected', []);
                              }
                              field.onChange(checked);
                            }
                          }}
                          />
                        )}
                      />

                      {toggleState['allFederalSR'] && <FormField
                        control={form.control}
                        name="allFederalSRSelected"
                        render={() => (
                          <CheckboxList
                            items={federalSR}
                            form={form}
                            name="allFederalSRSelected"
                            subHeaderName={"allFederalSR"}
                            headerName={"allFederalSRR"}
                            optionalHeaderName={"allFederal"}
                          />

                        )}
                      />}
                      <FormField
                        control={form.control}
                        name="allFederalRule"
                        render={({ field }) => (
                          <CheckboxWithToggle name={'allFederalRule'} label={'Rules'} className={'ml-5'}
                            field={{
                              ...field,
                              onChange: (checked: boolean) => {
                                if (checked) {
                                  if (checked && form.getValues('allData')) {
                                    form.setValue('allData', false);



                                  }
                                  form.setValue('allFederal', false);
                                  form.setValue('allFederalRule', false);


                                  form.setValue('allFederalRuleSelected', []);

                                }
                                field.onChange(checked);
                              }
                            }} />

                        )}
                      />
                      {toggleState['allFederalRule'] && <FormField
                        control={form.control}
                        name="allFederalRuleSelected"
                        render={() => (
                          <CheckboxList
                            items={federalRule}
                            form={form}
                            name="allFederalRuleSelected"
                            subHeaderName={"allFederalRule"}
                            headerName={"allFederal"}
                            optionalHeaderName={"allFederalSRR"}
                          />
                        )}
                      />}
                    </>
                  )}
                </>
              }
              <FormField
                control={form.control}
                name="allState"
                render={({ field }) => (
                  <CheckboxWithToggle
                    label={'All State'}
                    name={'allState'}
                    field={{
                      ...field,
                      onChange: (checked: boolean) => {
                        if (checked && form.getValues('allData') || form.getValues('allStateCases') || form.getValues('allStateSRR')) {
                          form.setValue('allData', false);
                          form.setValue('allStateCases', false);
                          form.setValue('allStateSRR', false);
                          form.setValue('allStateCasesSelected', [])
                          form.setValue('allStateSRRSelected', []);
                          form.setValue('allStateSRRStateSelected', []);

                        } else if (checked) {
                          form.setValue('allStateCasesSelected', [])
                          form.setValue('allStateSRRSelected', []);
                          form.setValue('allStateSRRStateSelected', []);



                        }
                        field.onChange(checked);
                      }
                    }}
                    className={''}
                  />
                )}
              />

              {toggleState['allState'] &&
                <>
                  <FormField
                    control={form.control}
                    name="allStateCases"
                    render={({ field }) => (
                      <CheckboxWithToggle name={"allStateCases"} className={'ml-3'} label={'All State Cases'} field={{
                        ...field,
                        onChange: (checked: boolean) => {
                          if (checked && form.getValues('allState')) {
                            form.setValue('allState', false);
                            form.setValue('allStateCasesSelected', [])

                          } else if (checked) {
                            form.setValue('allStateCasesSelected', [])

                          }
                          field.onChange(checked);
                        }
                      }} />

                    )}
                  />
                  {toggleState['allStateCases'] && (
                    <FormField
                      control={form.control}
                      name="allStateCasesSelected"
                      render={() => (
                        <CheckboxList
                          items={statesCases}
                          form={form}
                          name="allStateCasesSelected"
                          subHeaderName="allStateCases"
                          headerName='allState'
                        />
                      )}
                    />
                  )}
                  {toggleState['allState'] && <FormField
                    control={form.control}
                    name="allStateSRR"
                    render={({ field }) => (
                      <CheckboxWithToggle name={'allStateSRR'} label={'All State Statutes, Regulation, and Rules'} field={{
                        ...field,
                        onChange: (checked: boolean) => {
                          if (checked && form.getValues('allState')) {
                            form.setValue('allState', false);
                            form.setValue('allStateSRRSelected', []);
                            form.setValue('allStateSRRStateSelected', []);

                          } else if (checked) {
                            form.setValue('allStateSRRSelected', []);
                            form.setValue('allStateSRRStateSelected', []);

                          }
                          field.onChange(checked);
                        }
                      }} className={'ml-3'} />
                    )}
                  />}

                  {toggleState['allStateSRR'] && allStatesCases.map((state) => (
                    <FormField
                      key={`allStateSRR${state.value}`}
                      control={form.control}
                      name={`allStateSRRStateSelected`}
                      render={({ field }) => (
                        <CheckboxListWithToggle key={state.value} form={form} label={`${state.value}`} name={`${state.value}SRR`} mField={field} className={'ml-5'} />
                      )}
                    />
                  ))}
                </>
              }
              <Button className="flex mt-4" type="submit">Submit</Button>
            </form>
          </Form>
        </main>
      </DialogContent>
    </Dialog>
  )

}

export default LegalFilterModal;
